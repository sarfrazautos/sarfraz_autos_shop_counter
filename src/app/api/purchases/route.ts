import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  purchases,
  purchaseItems,
  productBranchStock,
  products,
  vendors,
  vendorLedgerTransactions,
} from '@/schema';
import { sql, and, eq, ilike, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = 12;
    const offset = (page - 1) * pageSize;

    const search = searchParams.get('search')?.trim();
    const vendorId = searchParams.get('vendorId');
    const branchId = searchParams.get('branchId');
    const paymentStatus = searchParams.get('status');

    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${purchases.invoiceNumber} ILIKE ${`%${search}%`} OR ${purchases.vendorName} ILIKE ${`%${search}%`})`
      );
    }

    if (vendorId && vendorId !== 'all' && vendorId !== 'All') {
      conditions.push(eq(purchases.vendorId, vendorId));
    }

    if (branchId && branchId !== 'all' && branchId !== 'All') {
      conditions.push(eq(purchases.branchId, branchId));
    }

    if (paymentStatus && paymentStatus !== 'all' && paymentStatus !== 'All') {
      conditions.push(eq(purchases.paymentStatus, paymentStatus));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchases)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    const purchaseRows = await db.query.purchases.findMany({
      where: whereClause,
      limit: pageSize,
      offset: offset,
      orderBy: desc(purchases.purchaseDate),
      with: {
        items: true,
        branch: true,
      },
    });

    const formatted = purchaseRows.map((p) => ({
      id: p.id,
      invoiceNumber: p.invoiceNumber,
      vendorId: p.vendorId,
      vendorName: p.vendorName,
      branchId: p.branchId,
      branchName: p.branch?.name || p.branchId,
      branchShortName: p.branch?.shortName || p.branchId,
      totalAmount: parseFloat(p.totalAmount || '0'),
      paidAmount: parseFloat(p.paidAmount || '0'),
      balanceDue: parseFloat(p.balanceDue || '0'),
      paymentStatus: p.paymentStatus,
      billAttachmentUrl: p.billAttachmentUrl,
      remarks: p.remarks,
      purchaseDate: p.purchaseDate,
      createdAt: p.createdAt,
      items: (p.items || []).map((it) => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        bikeModel: it.bikeModel,
        purchaseRate: parseFloat(it.purchaseRate || '0'),
        quantity: it.quantity,
        freeQuantity: it.freeQuantity,
        isNetScheme: it.isNetScheme,
        schemeNote: it.schemeNote,
        lineTotal: parseFloat(it.lineTotal || '0'),
      })),
    }));

    return NextResponse.json({
      purchases: formatted,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch purchases' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vendorId,
      vendorName,
      invoiceNumber,
      branchId = 'main',
      items,
      paidAmount = 0,
      billAttachmentUrl,
      remarks,
    } = body;

    if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Vendor and at least 1 item are required' }, { status: 400 });
    }

    const purchaseId = `PO-${Math.floor(10000 + Math.random() * 90000)}`;
    const billNumber = invoiceNumber?.trim() || `BILL-${Math.floor(1000 + Math.random() * 9000)}`;

    let subtotal = 0;
    const cleanItems = items.map((it: any, index: number) => {
      const rate = parseFloat(it.purchaseRate || it.rate || '0');
      const qty = parseInt(it.quantity || '1', 10);
      const freeQty = parseInt(it.freeQuantity || '0', 10);
      const lineTotal = rate * qty;
      subtotal += lineTotal;

      return {
        id: `${purchaseId}-ITM-${index + 1}`,
        purchaseId,
        productId: it.productId,
        productName: it.productName || it.name,
        sku: it.sku || 'SKU-GEN',
        bikeModel: it.bikeModel || 'Universal',
        purchaseRate: rate.toFixed(2),
        quantity: qty,
        freeQuantity: freeQty,
        isNetScheme: Boolean(it.isNetScheme),
        schemeNote: it.schemeNote || (freeQty > 0 ? `+${freeQty} Free Bonus` : it.isNetScheme ? 'Net Scheme' : null),
        lineTotal: lineTotal.toFixed(2),
        totalReceivedQty: qty + freeQty,
      };
    });

    const paid = parseFloat(paidAmount || '0') || 0;
    const balanceDue = Math.max(0, subtotal - paid);
    const paymentStatus = balanceDue <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

    // 1. Insert Purchase
    const [newPurchase] = await db
      .insert(purchases)
      .values({
        id: purchaseId,
        invoiceNumber: billNumber,
        vendorId,
        vendorName: vendorName || 'Vendor',
        branchId,
        totalAmount: subtotal.toFixed(2),
        paidAmount: paid.toFixed(2),
        balanceDue: balanceDue.toFixed(2),
        paymentStatus,
        billAttachmentUrl: billAttachmentUrl || null,
        remarks: remarks?.trim() || null,
        purchaseDate: new Date(),
      })
      .returning();

    // 2. Insert Purchase Items
    await db.insert(purchaseItems).values(
      cleanItems.map(({ totalReceivedQty, ...rest }) => rest)
    );

    // 3. Update Inventory Stock (Add received units including free units)
    for (const it of cleanItems) {
      if (it.productId) {
        // Increment branch stock
        const existingStock = await db.query.productBranchStock.findFirst({
          where: and(
            eq(productBranchStock.productId, it.productId),
            eq(productBranchStock.branchId, branchId)
          ),
        });

        if (existingStock) {
          await db
            .update(productBranchStock)
            .set({
              stockQuantity: existingStock.stockQuantity + it.totalReceivedQty,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(productBranchStock.productId, it.productId),
                eq(productBranchStock.branchId, branchId)
              )
            );
        } else {
          await db.insert(productBranchStock).values({
            id: `stk-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            productId: it.productId,
            branchId,
            stockQuantity: it.totalReceivedQty,
          });
        }

        // Increment total product stock
        await db
          .update(products)
          .set({
            totalStock: sql`${products.totalStock} + ${it.totalReceivedQty}`,
            costPrice: it.purchaseRate, // Update latest cost price
            updatedAt: new Date(),
          })
          .where(eq(products.id, it.productId));
      }
    }

    // 4. Update Vendor Khata (Vendor Ledger)
    const vendorRecord = await db.query.vendors.findFirst({
      where: eq(vendors.id, vendorId),
    });

    if (vendorRecord) {
      const currentBal = parseFloat(vendorRecord.currentBalance || '0');
      const newBalAfterBill = currentBal + subtotal;
      const finalBal = newBalAfterBill - paid;

      // Bill transaction
      await db.insert(vendorLedgerTransactions).values({
        id: `VTX-${Date.now()}-BILL`,
        vendorId,
        purchaseId,
        transactionType: 'BILL',
        amount: subtotal.toFixed(2),
        balanceAfter: newBalAfterBill.toFixed(2),
        paymentMode: 'On Bill Credit',
        referenceNumber: billNumber,
        proofAttachmentUrl: billAttachmentUrl || null,
        description: `Purchase Bill #${billNumber} (${cleanItems.length} items received in ${branchId})`,
      });

      // If paid amount > 0, insert payment transaction
      if (paid > 0) {
        await db.insert(vendorLedgerTransactions).values({
          id: `VTX-${Date.now()}-PAY`,
          vendorId,
          purchaseId,
          transactionType: 'PAYMENT',
          amount: paid.toFixed(2),
          balanceAfter: finalBal.toFixed(2),
          paymentMode: 'Cash / Bank',
          referenceNumber: `PAY-${billNumber}`,
          proofAttachmentUrl: null,
          description: `Advance / Immediate Payment against Bill #${billNumber}`,
        });
      }

      await db
        .update(vendors)
        .set({
          currentBalance: finalBal.toFixed(2),
        })
        .where(eq(vendors.id, vendorId));
    }

    return NextResponse.json({
      purchase: newPurchase,
      message: `Purchase Bill #${billNumber} recorded and ${cleanItems.length} items added to stock successfully!`,
    });
  } catch (error: any) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ error: error.message || 'Failed to record purchase' }, { status: 500 });
  }
}
