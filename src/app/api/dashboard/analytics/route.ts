import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, branches } from '@/schema';
import { sql, eq, gte, desc, and, ne } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const daysParam = parseInt(searchParams.get('days') || '30', 10);
    const days = [7, 30, 60].includes(daysParam) ? daysParam : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 1. Daily Sales Revenue (excluding Cancelled orders)
    const dailyRows = await db
      .select({
        dayStr: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
        totalSales: sql<number>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
      })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), ne(orders.orderStatus, 'Cancelled')))
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

    const salesMap = new Map<string, number>();
    dailyRows.forEach((r) => {
      salesMap.set(r.dayStr, Number(r.totalSales));
    });

    // Generate continuous date array for the period
    const dailyRevenue = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const rawSales = salesMap.get(dateKey) || 0;
      // Convert to thousands (k PKR) for chart display
      dailyRevenue.push({
        date: dateKey,
        salesRevenue: Math.round((rawSales / 1000) * 10) / 10,
        rawSalesPKR: rawSales,
      });
    }

    // 2. Sales by Order Type (excluding Cancelled)
    const typeRows = await db
      .select({
        type: orders.orderType,
        count: sql<number>`count(*)`,
        total: sql<number>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)`,
      })
      .from(orders)
      .where(ne(orders.orderStatus, 'Cancelled'))
      .groupBy(orders.orderType);

    const grandTotal = typeRows.reduce((acc, r) => acc + Number(r.total), 0);
    const totalCount = typeRows.reduce((acc, r) => acc + Number(r.count), 0);

    const typeConfig: Record<string, { name: string; color: string }> = {
      Wholesale: { name: 'Wholesale Dealers', color: '#10b981' },
      Retail: { name: 'Retail Walk-in', color: '#0284c7' },
      Workshop: { name: 'Mechanics / Accounts', color: '#f59e0b' },
    };

    let salesByOrderType = typeRows.map((r) => {
      const config = typeConfig[r.type] || { name: r.type, color: '#8b5cf6' };
      const share = grandTotal > 0 ? Math.round((Number(r.total) / grandTotal) * 100) : 0;
      return {
        name: config.name,
        share,
        color: config.color,
        count: Number(r.count),
        total: Number(r.total),
      };
    });

    if (salesByOrderType.length === 0) {
      salesByOrderType = [
        { name: 'Wholesale Dealers', share: 0, color: '#10b981', count: 0, total: 0 },
        { name: 'Retail Walk-in', share: 0, color: '#0284c7', count: 0, total: 0 },
        { name: 'Mechanics / Accounts', share: 0, color: '#f59e0b', count: 0, total: 0 },
      ];
    }

    // 3. Branch Counter Performance (excluding Cancelled)
    const branchRows = await db
      .select({
        id: branches.id,
        name: branches.name,
        shortName: branches.shortName,
        sales: sql<number>`COALESCE(SUM(CASE WHEN ${orders.orderStatus} != 'Cancelled' THEN ${orders.totalAmount}::numeric ELSE 0 END), 0)`,
        orders: sql<number>`count(CASE WHEN ${orders.orderStatus} != 'Cancelled' THEN ${orders.id} ELSE NULL END)`,
      })
      .from(branches)
      .leftJoin(orders, eq(orders.branchId, branches.id))
      .groupBy(branches.id, branches.name, branches.shortName);

    const branchPerformance = branchRows.map((b) => ({
      branch: b.shortName || b.name.split('(')[0].trim(),
      sales: Math.round(Number(b.sales) / 1000), // in '000 PKR
      orders: Number(b.orders),
    }));

    // 4. Top Bike Models Spare Parts Demand (excluding Cancelled orders)
    const bikeModelRows = await db
      .select({
        bikeModel: orderItems.bikeModel,
        partsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(ne(orders.orderStatus, 'Cancelled'))
      .groupBy(orderItems.bikeModel)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(5);

    let topBikeModels = bikeModelRows.map((bm) => ({
      model: bm.bikeModel,
      partsSold: Number(bm.partsSold),
    }));

    if (topBikeModels.length === 0) {
      topBikeModels = [
        { model: 'Honda CD70', partsSold: 0 },
        { model: 'Honda CG125', partsSold: 0 },
        { model: 'Crown 70cc', partsSold: 0 },
        { model: 'Suzuki GS150', partsSold: 0 },
        { model: 'Yamaha YBR', partsSold: 0 },
      ];
    }

    return NextResponse.json({
      success: true,
      data: {
        periodDays: days,
        dailyRevenue,
        salesByOrderType,
        branchPerformance,
        topBikeModels,
        summary: {
          totalSalesPKR: grandTotal,
          totalOrders: totalCount,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard/analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compute dashboard analytics' },
      { status: 500 }
    );
  }
}
