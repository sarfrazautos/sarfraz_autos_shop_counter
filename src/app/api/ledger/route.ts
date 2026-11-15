import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, customerLedgerTransactions } from '@/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    // 1. Fetch all customers with their running balance
    const customerRows = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        city: customers.city,
        route: customers.route,
        salesman: customers.salesman,
        currentBalance: customers.currentBalance,
        creditLimit: customers.creditLimit,
        openingBalance: customers.openingBalance,
        lastPaymentDate: customers.lastPaymentDate,
      })
      .from(customers)
      .orderBy(customers.name);

    // 2. Fetch transactions for selected customer or all
    let targetCustomerId = customerId || customerRows[0]?.id;

    let transactions: any[] = [];
    if (targetCustomerId) {
      const txRows = await db
        .select()
        .from(customerLedgerTransactions)
        .where(eq(customerLedgerTransactions.customerId, targetCustomerId))
        .orderBy(desc(customerLedgerTransactions.transactionDate));

      transactions = txRows.map((tx) => ({
        id: tx.id,
        voucherNo: tx.voucherNumber,
        date: tx.transactionDate.toISOString().split('T')[0],
        type: tx.transactionType,
        description: tx.description,
        debit: Number(tx.debitAmount),
        credit: Number(tx.creditAmount),
        balance: Number(tx.runningBalance),
        collector: tx.collectorName || 'Counter Cashier',
      }));
    }

    const accounts = customerRows.map((c) => ({
      id: c.id,
      customerName: c.name,
      phone: c.phone,
      city: c.city,
      route: c.route,
      salesman: c.salesman,
      currentBalance: Number(c.currentBalance),
      creditLimit: Number(c.creditLimit),
      openingBalance: Number(c.openingBalance),
      lastPaymentDate: c.lastPaymentDate
        ? c.lastPaymentDate.toISOString().split('T')[0]
        : null,
      transactions: c.id === targetCustomerId ? transactions : [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        selectedCustomerId: targetCustomerId,
        transactions,
      },
    });
  } catch (error) {
    console.error('GET /api/ledger error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ledger accounts' },
      { status: 500 }
    );
  }
}
