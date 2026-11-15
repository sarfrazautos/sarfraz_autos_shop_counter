import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, customerLedgerTransactions } from '@/schema';
import { sql, and, eq, ilike, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = 12; // STRICT REQUIREMENT: 12 ITEMS PER PAGE
    const offset = (page - 1) * pageSize;

    const search = searchParams.get('search')?.trim();
    const route = searchParams.get('route');
    const customerType = searchParams.get('type');

    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${customers.name} ILIKE ${`%${search}%`} OR ${customers.phone} ILIKE ${`%${search}%`} OR ${customers.id} ILIKE ${`%${search}%`} OR ${customers.city} ILIKE ${`%${search}%`} OR ${customers.route} ILIKE ${`%${search}%`})`
      );
    }

    if (route && route !== 'all' && route !== 'All') {
      conditions.push(eq(customers.route, route));
    }

    if (customerType && customerType !== 'all' && customerType !== 'All') {
      conditions.push(eq(customers.customerType, customerType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Query 12 items
    const rows = await db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(pageSize)
      .offset(offset);

    const formatted = rows.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      city: c.city,
      route: c.route,
      salesman: c.salesman,
      customerType: c.customerType,
      paymentMethod: c.paymentMethod,
      openingBalance: Number(c.openingBalance),
      currentBalance: Number(c.currentBalance),
      creditLimit: Number(c.creditLimit),
      lastPaymentDate: c.lastPaymentDate
        ? c.lastPaymentDate.toISOString().split('T')[0]
        : null,
      createdAt: c.createdAt.toISOString().split('T')[0],
    }));

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
    console.error('GET /api/customers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      city = 'Karachi',
      route = 'Saddar Counter',
      salesman = 'Counter Cashier',
      customerType = 'Wholesale Dealer',
      paymentMethod = 'Credit / Khata',
      creditLimit = 100000,
      openingBalance = 0,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Customer Name and Phone number are required' },
        { status: 400 }
      );
    }

    // Check duplicate phone
    const existing = await db.query.customers.findFirst({
      where: eq(customers.phone, phone),
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A customer with this phone number already exists' },
        { status: 409 }
      );
    }

    const nextIdNumber = Math.floor(100 + Math.random() * 900);
    const customerId = `CUST-${nextIdNumber}`;
    const opBalNum = parseFloat(openingBalance) || 0;
    const credLimitNum = parseFloat(creditLimit) || 100000;

    await db.insert(customers).values({
      id: customerId,
      name,
      phone,
      city,
      route,
      salesman,
      customerType,
      paymentMethod,
      openingBalance: opBalNum.toFixed(2),
      currentBalance: opBalNum.toFixed(2),
      creditLimit: credLimitNum.toFixed(2),
      createdAt: new Date(),
    });

    // If opening balance > 0, log an opening ledger transaction
    if (opBalNum > 0) {
      await db.insert(customerLedgerTransactions).values({
        id: `VCH-${Date.now()}`,
        customerId,
        voucherNumber: `OB-${customerId}`,
        transactionType: 'Opening Balance',
        description: 'Initial opening balance brought forward',
        debitAmount: opBalNum.toFixed(2),
        creditAmount: '0.00',
        runningBalance: opBalNum.toFixed(2),
        collectorName: salesman,
        transactionDate: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: customerId,
        name,
        phone,
        city,
        route,
        salesman,
        customerType,
        paymentMethod,
        openingBalance: opBalNum,
        currentBalance: opBalNum,
        creditLimit: credLimitNum,
      },
      message: 'Customer registered successfully',
    });
  } catch (error) {
    console.error('POST /api/customers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
