import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  orders,
  orderItems,
  products,
  productBranchStock,
  customers,
  customerLedgerTransactions,
  notifications,
} from '@/schema';
import { sql, and, eq, ilike, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = 12; // STRICT REQUIREMENT: 12 ITEMS PER PAGE
    const offset = (page - 1) * pageSize;

    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');
    const orderType = searchParams.get('type');

    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${orders.invoiceNumber} ILIKE ${`%${search}%`} OR ${orders.customerName} ILIKE ${`%${search}%`} OR ${orders.customerPhone} ILIKE ${`%${search}%`})`
      );
    }

    if (status && status !== 'all' && status !== 'All') {
      conditions.push(eq(orders.orderStatus, status));
    }

    if (branchId && branchId !== 'all' && branchId !== 'All') {
      conditions.push(eq(orders.branchId, branchId));
    }

    if (orderType && orderType !== 'all' && orderType !== 'All') {
      conditions.push(eq(orders.orderType, orderType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total Count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch 12 orders with items
    const orderRows = await db.query.orders.findMany({
      where: whereClause,
      limit: pageSize,
      offset: offset,
      orderBy: [desc(orders.createdAt)],
      with: {
        items: true,
      },
    });

    const formatted = orderRows.map((o) => {
      const itemsList = o.items.map((i) => ({
        name: i.productName,
        subLabel: `${i.sku} | ${i.bikeModel}`,
        quantity: i.quantity,
        rate: Number(i.unitRate),
        total: Number(i.lineTotal),
      }));

      const totalQuantity = o.items.reduce((sum, item) => sum + item.quantity, 0);

      const d = o.createdAt;
      const dateFormatted = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeFormatted = d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const godownName =
        o.branchId === 'main'
          ? 'SADDAR MAIN WORKSHOP'
          : o.branchId === 'branch-2'
          ? 'GULSHAN AUTO HUB'
          : 'DHA EXPRESS COUNTER';

      return {
        id: `#${o.invoiceNumber}`,
        invoiceNumber: o.invoiceNumber,
        customerName: o.customerName,
        customerCity: o.customerCity,
        customerAddress: `${o.customerCity}, Pakistan`,
        customerPhone: o.customerPhone || 'N/A',
        items: itemsList,
        totalQuantity,
        type: o.orderType as 'Wholesale' | 'Retail' | 'Both',
        totalAmount: Number(o.totalAmount),
        shippingCharges: Number(o.shippingCharges),
        cashReceived: Number(o.cashReceived),
        netBill: Number(o.totalAmount) + Number(o.shippingCharges),
        finalBalance: Number(o.netBalanceAdded),
        status: o.orderStatus as 'Completed' | 'Pending' | 'In-Progress' | 'Cancelled',
        date: dateFormatted,
        dateTimeFull: `${dateFormatted.toUpperCase()} ${timeFormatted}`,
        paymentMethod:
          o.paymentMethod === 'Cash on Counter'
            ? 'Cash on Counter'
            : o.paymentMethod === 'Credit / Khata'
            ? 'On Credit / COD'
            : 'Online Transfer',
        godown: godownName,
        remarks: o.remarks || '',
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerId = 'CUST-001',
      customerName = 'Walk-in Retail Rider',
      customerPhone = '0300-0000000',
      customerCity = 'Karachi',
      branchId = 'main',
      orderType = 'Wholesale',
      paymentMethod = 'Cash on Counter',
      items = [],
      subtotalAmount = 0,
      discountAmount = 0,
      shippingCharges = 0,
      totalAmount = 0,
      cashReceived = 0,
      changeReturned = 0,
      netBalanceAdded = 0,
      remarks = '',
      createdByUserId = 'admin@sarfrazautos-counter.com',
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Generate unique invoice number
    let invoiceNumber = `SA-${Math.floor(10000 + Math.random() * 90000)}`;
    let isUnique = false;
    while (!isUnique) {
      const existing = await db.query.orders.findFirst({
        where: eq(orders.invoiceNumber, invoiceNumber),
      });
      if (!existing) {
        isUnique = true;
      } else {
        invoiceNumber = `SA-${Math.floor(10000 + Math.random() * 90000)}`;
      }
    }

    const orderId = `ORD-${Date.now()}`;

    // Check if registered customer exists
    let targetCustomerId = customerId || 'walkin';
    const existingCust = customerId && customerId !== 'walkin'
      ? await db.query.customers.findFirst({
          where: eq(customers.id, customerId),
        })
      : null;

    if (existingCust) {
      targetCustomerId = existingCust.id;
    }

    // 1. Insert order
    await db.insert(orders).values({
      id: orderId,
      invoiceNumber,
      customerId: targetCustomerId,
      customerName,
      customerPhone,
      customerCity,
      branchId,
      orderType,
      orderStatus: 'Completed',
      paymentMethod,
      subtotalAmount: parseFloat(subtotalAmount).toFixed(2),
      discountAmount: parseFloat(discountAmount).toFixed(2),
      shippingCharges: parseFloat(shippingCharges).toFixed(2),
      totalAmount: parseFloat(totalAmount).toFixed(2),
      cashReceived: parseFloat(cashReceived).toFixed(2),
      changeReturned: parseFloat(changeReturned).toFixed(2),
      netBalanceAdded: parseFloat(netBalanceAdded).toFixed(2),
      remarks,
      createdByUserId,
      createdAt: new Date(),
    });

    // 2. Insert order items & adjust branch stock
    const itemRecords = [];
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const itemId = `OI-${orderId}-${idx + 1}`;
      const qty = parseInt(it.quantity, 10) || 1;
      const unitRate = parseFloat(it.rate || it.unitRate || 0);
      const lineTotal = parseFloat(it.total || it.lineTotal || unitRate * qty);

      itemRecords.push({
        id: itemId,
        orderId,
        productId: it.productId || it.id || 'PRD-101',
        productName: it.name || it.productName || 'Auto Spare Part',
        sku: it.sku || 'SKU-GEN',
        bikeModel: it.bikeModel || 'Universal',
        category: it.category || 'Spare Parts',
        unitRate: unitRate.toFixed(2),
        pricingTier: it.pricingTier || orderType,
        isSchemeApplied: Boolean(it.isSchemeActive || it.isSchemeApplied),
        schemeRate: it.schemeRate ? parseFloat(it.schemeRate).toFixed(2) : null,
        quantity: qty,
        lineTotal: lineTotal.toFixed(2),
      });

      // Stock adjustment if product ID exists
      if (it.productId || it.id) {
        const prodId = it.productId || it.id;
        const branchStockRecord = await db.query.productBranchStock.findFirst({
          where: and(
            eq(productBranchStock.productId, prodId),
            eq(productBranchStock.branchId, branchId)
          ),
        });

        if (branchStockRecord) {
          const newQty = Math.max(0, branchStockRecord.stockQuantity - qty);
          await db
            .update(productBranchStock)
            .set({ stockQuantity: newQty, updatedAt: new Date() })
            .where(eq(productBranchStock.id, branchStockRecord.id));

          // Also reduce total stock on product
          const allBS = await db.query.productBranchStock.findMany({
            where: eq(productBranchStock.productId, prodId),
          });
          const newTotalStock = allBS.reduce((sum, b) => sum + b.stockQuantity, 0);

          await db
            .update(products)
            .set({
              totalStock: newTotalStock,
              status: newTotalStock === 0 ? 'Out of Stock' : newTotalStock <= 15 ? 'Low Stock' : 'In Stock',
              updatedAt: new Date(),
            })
            .where(eq(products.id, prodId));
        }
      }
    }

    if (itemRecords.length > 0) {
      await db.insert(orderItems).values(itemRecords);
    }

    // 3. Customer Ledger Khata Update if credit balance added
    const netBalNum = parseFloat(netBalanceAdded) || 0;
    if (netBalNum > 0 && existingCust) {
      const currentBal = Number(existingCust.currentBalance || 0);
      const updatedBal = currentBal + netBalNum;

      await db.insert(customerLedgerTransactions).values({
        id: `CLT-ORD-${orderId}`,
        customerId: existingCust.id,
        orderId,
        voucherNumber: invoiceNumber,
        transactionType: 'Sale Invoice',
        description: `Sale Invoice #${invoiceNumber} (${items.length} items)`,
        debitAmount: netBalNum.toFixed(2),
        creditAmount: '0.00',
        runningBalance: updatedBal.toFixed(2),
        collectorName: 'Counter Cashier',
        transactionDate: new Date(),
      });

      await db
        .update(customers)
        .set({
          currentBalance: updatedBal.toFixed(2),
        })
        .where(eq(customers.id, existingCust.id));
    }

    // 4. Notification
    await db.insert(notifications).values({
      id: `NOTIF-${Date.now()}`,
      title: `New Counter Order #${invoiceNumber}`,
      description: `Order created for ${customerName}. Amount: Rs. ${parseFloat(totalAmount).toLocaleString()}`,
      notificationType: 'orders',
      branchId,
      isRead: false,
      isUrgent: false,
      actionUrl: `/dashboard/orders?search=${invoiceNumber}`,
      actionLabel: 'View Order',
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        invoiceNumber,
        totalAmount,
      },
      message: `Invoice #${invoiceNumber} generated successfully.`,
    });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create counter order',
      },
      { status: 500 }
    );
  }
}
