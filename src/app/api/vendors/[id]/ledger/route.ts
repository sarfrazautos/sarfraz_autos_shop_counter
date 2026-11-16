import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vendors, vendorLedgerTransactions } from '@/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, id),
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const transactions = await db.query.vendorLedgerTransactions.findMany({
      where: eq(vendorLedgerTransactions.vendorId, id),
      orderBy: desc(vendorLedgerTransactions.transactionDate),
      limit: 100,
    });

    return NextResponse.json({
      vendor: {
        ...vendor,
        openingBalance: parseFloat(vendor.openingBalance || '0'),
        currentBalance: parseFloat(vendor.currentBalance || '0'),
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        purchaseId: t.purchaseId,
        transactionType: t.transactionType,
        amount: parseFloat(t.amount || '0'),
        balanceAfter: parseFloat(t.balanceAfter || '0'),
        paymentMode: t.paymentMode,
        referenceNumber: t.referenceNumber,
        proofAttachmentUrl: t.proofAttachmentUrl,
        description: t.description,
        transactionDate: t.transactionDate,
        createdAt: t.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching vendor ledger:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vendor ledger' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, transactionType, paymentMode, referenceNumber, description, proofAttachmentUrl } = body;

    const payAmount = parseFloat(amount || '0');
    if (!payAmount || payAmount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, id),
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const currentBal = parseFloat(vendor.currentBalance || '0');
    // If PAYMENT to vendor, balance decreases. If BILL/DEBIT, balance increases.
    const newBal = transactionType === 'PAYMENT' ? currentBal - payAmount : currentBal + payAmount;

    const txId = `VTX-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const [newTx] = await db
      .insert(vendorLedgerTransactions)
      .values({
        id: txId,
        vendorId: id,
        transactionType: transactionType || 'PAYMENT',
        amount: payAmount.toFixed(2),
        balanceAfter: newBal.toFixed(2),
        paymentMode: paymentMode || 'Cash',
        referenceNumber: referenceNumber?.trim() || null,
        proofAttachmentUrl: proofAttachmentUrl || null,
        description: description?.trim() || `Payment made to vendor via ${paymentMode || 'Cash'}`,
      })
      .returning();

    await db
      .update(vendors)
      .set({
        currentBalance: newBal.toFixed(2),
      })
      .where(eq(vendors.id, id));

    return NextResponse.json({
      transaction: {
        ...newTx,
        amount: parseFloat(newTx.amount),
        balanceAfter: parseFloat(newTx.balanceAfter),
      },
      updatedBalance: newBal,
      message: 'Transaction recorded successfully',
    });
  } catch (error: any) {
    console.error('Error creating vendor ledger transaction:', error);
    return NextResponse.json({ error: error.message || 'Failed to record transaction' }, { status: 500 });
  }
}
