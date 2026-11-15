import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, customerLedgerTransactions } from '@/schema';
import { sql, and, eq, desc } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = 12; // STRICT REQUIREMENT: 12 ITEMS PER PAGE
    const offset = (page - 1) * pageSize;

    const txType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Verify customer exists
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const conditions = [eq(customerLedgerTransactions.customerId, customerId)];

    if (txType && txType !== 'all' && txType !== 'All') {
      conditions.push(eq(customerLedgerTransactions.transactionType, txType));
    }

    if (startDate) {
      conditions.push(sql`${customerLedgerTransactions.transactionDate} >= ${new Date(startDate)}`);
    }

    if (endDate) {
      conditions.push(sql`${customerLedgerTransactions.transactionDate} <= ${new Date(endDate)}`);
    }

    const whereClause = and(...conditions);

    // Total Count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerLedgerTransactions)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch 12 items
    const rows = await db
      .select()
      .from(customerLedgerTransactions)
      .where(whereClause)
      .orderBy(desc(customerLedgerTransactions.transactionDate))
      .limit(pageSize)
      .offset(offset);

    const formatted = rows.map((r) => ({
      id: r.id,
      voucherNumber: r.voucherNumber,
      orderId: r.orderId,
      type: r.transactionType,
      description: r.description,
      debit: Number(r.debitAmount),
      credit: Number(r.creditAmount),
      runningBalance: Number(r.runningBalance),
      collectorName: r.collectorName,
      date: r.transactionDate.toISOString().split('T')[0],
      createdAt: r.transactionDate.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        city: customer.city,
        route: customer.route,
        salesman: customer.salesman,
        currentBalance: Number(customer.currentBalance),
        creditLimit: Number(customer.creditLimit),
      },
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
    console.error('GET /api/customers/[id]/ledger error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer ledger' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const body = await req.json();

    const {
      transactionType = 'Cash Recovery', // 'Cash Recovery' | 'Bank Transfer' | 'Return Adjustment' | 'Manual Debit'
      amount,
      description,
      collectorName = 'Counter Cashier',
      paymentMethod = 'Cash',
    } = body;

    const parsedAmount = Math.abs(parseFloat(amount) || 0);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid transaction amount greater than zero is required' },
        { status: 400 }
      );
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const currentBal = Number(customer.currentBalance);
    let isCredit = true;
    let newBalance = currentBal;
    let debitAmount = 0;
    let creditAmount = 0;

    if (
      transactionType === 'Cash Recovery' ||
      transactionType === 'Bank Transfer' ||
      transactionType === 'Return Adjustment'
    ) {
      // Payment received reduces balance (Credit)
      creditAmount = parsedAmount;
      newBalance = currentBal - parsedAmount;
      isCredit = true;
    } else {
      // Debit increases balance
      debitAmount = parsedAmount;
      newBalance = currentBal + parsedAmount;
      isCredit = false;
    }

    const voucherNumber = `VCH-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const txId = `CLT-${Date.now()}`;

    await db.insert(customerLedgerTransactions).values({
      id: txId,
      customerId,
      voucherNumber,
      transactionType,
      description: description || `${transactionType} via ${paymentMethod}`,
      debitAmount: debitAmount.toFixed(2),
      creditAmount: creditAmount.toFixed(2),
      runningBalance: newBalance.toFixed(2),
      collectorName,
      transactionDate: new Date(),
    });

    // Update customer current balance & last payment date
    await db
      .update(customers)
      .set({
        currentBalance: newBalance.toFixed(2),
        lastPaymentDate: isCredit ? new Date() : customer.lastPaymentDate,
      })
      .where(eq(customers.id, customerId));

    return NextResponse.json({
      success: true,
      data: {
        id: txId,
        voucherNumber,
        newBalance,
      },
      message: `${transactionType} of Rs. ${parsedAmount.toLocaleString()} recorded successfully`,
    });
  } catch (error) {
    console.error('POST /api/customers/[id]/ledger error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record ledger transaction' },
      { status: 500 }
    );
  }
}
