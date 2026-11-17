import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, products, branches } from '@/schema';
import { sql, eq, and, desc, ne, ilike } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || 'this_month';
    const sortBy = searchParams.get('sortBy') || 'quantity'; // 'quantity' | 'revenue' | 'orders'
    const category = searchParams.get('category');
    const bikeModel = searchParams.get('bikeModel');
    const branchId = searchParams.get('branchId');
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Base conditions: exclude Cancelled orders
    const conditions = [ne(orders.orderStatus, 'Cancelled')];

    // Branch filter
    if (branchId && branchId !== 'all' && branchId !== 'All') {
      conditions.push(eq(orders.branchId, branchId));
    }

    // Category filter
    if (category && category !== 'all' && category !== 'All') {
      conditions.push(eq(orderItems.category, category));
    }

    // Bike model filter
    if (bikeModel && bikeModel !== 'all' && bikeModel !== 'All') {
      conditions.push(eq(orderItems.bikeModel, bikeModel));
    }

    // Search filter
    if (search) {
      conditions.push(
        sql`(${orderItems.productName} ILIKE ${`%${search}%`} OR ${orderItems.sku} ILIKE ${`%${search}%`})`
      );
    }

    // Time range filter
    switch (timeRange) {
      case 'today':
        conditions.push(sql`${orders.createdAt} >= CURRENT_DATE`);
        break;
      case '7days':
        conditions.push(sql`${orders.createdAt} >= NOW() - INTERVAL '7 days'`);
        break;
      case '30days':
        conditions.push(sql`${orders.createdAt} >= NOW() - INTERVAL '30 days'`);
        break;
      case 'this_month':
        conditions.push(sql`${orders.createdAt} >= date_trunc('month', CURRENT_DATE)`);
        break;
      case 'last_month':
        conditions.push(
          sql`${orders.createdAt} >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND ${orders.createdAt} < date_trunc('month', CURRENT_DATE)`
        );
        break;
      case 'this_year':
        conditions.push(sql`${orders.createdAt} >= date_trunc('year', CURRENT_DATE)`);
        break;
      case 'last_year':
        conditions.push(
          sql`${orders.createdAt} >= date_trunc('year', CURRENT_DATE - INTERVAL '1 year') AND ${orders.createdAt} < date_trunc('year', CURRENT_DATE)`
        );
        break;
      case 'custom':
        if (startDateParam) {
          conditions.push(sql`${orders.createdAt} >= ${new Date(startDateParam)}`);
        }
        if (endDateParam) {
          conditions.push(sql`${orders.createdAt} <= ${new Date(endDateParam + 'T23:59:59')}`);
        }
        break;
      case 'all_time':
      default:
        // No date restriction
        break;
    }

    const whereClause = and(...conditions);

    // 1. Overall Summary Totals
    const summaryRows = await db
      .select({
        totalUnitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::integer`,
        totalRevenue: sql<number>`COALESCE(SUM(${orderItems.lineTotal}::numeric), 0)::numeric`,
        distinctProductsCount: sql<number>`COUNT(DISTINCT ${orderItems.productId})::integer`,
        totalInvoicesCount: sql<number>`COUNT(DISTINCT ${orders.id})::integer`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(whereClause);

    const summary = {
      totalUnitsSold: Number(summaryRows[0]?.totalUnitsSold || 0),
      totalRevenue: Number(summaryRows[0]?.totalRevenue || 0),
      distinctProductsCount: Number(summaryRows[0]?.distinctProductsCount || 0),
      totalInvoicesCount: Number(summaryRows[0]?.totalInvoicesCount || 0),
    };

    // 2. Top Selling Products (Grouped by Product ID)
    const orderClause =
      sortBy === 'revenue'
        ? desc(sql`SUM(${orderItems.lineTotal}::numeric)`)
        : sortBy === 'orders'
        ? desc(sql`COUNT(DISTINCT ${orderItems.orderId})`)
        : desc(sql`SUM(${orderItems.quantity})`);

    const productSalesRows = await db
      .select({
        productId: orderItems.productId,
        productName: sql<string>`MAX(${orderItems.productName})`,
        sku: sql<string>`MAX(${orderItems.sku})`,
        bikeModel: sql<string>`MAX(${orderItems.bikeModel})`,
        category: sql<string>`MAX(${orderItems.category})`,
        unitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::integer`,
        totalRevenue: sql<number>`COALESCE(SUM(${orderItems.lineTotal}::numeric), 0)::numeric`,
        averageRate: sql<number>`COALESCE(AVG(${orderItems.unitRate}::numeric), 0)::numeric`,
        ordersCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})::integer`,
        currentStock: sql<number>`COALESCE(MAX(${products.totalStock}), 0)::integer`,
        lowStockThreshold: sql<number>`COALESCE(MAX(${products.lowStockThreshold}), 15)::integer`,
        brand: sql<string>`COALESCE(MAX(${products.brand}), 'Crown')`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(whereClause)
      .groupBy(orderItems.productId)
      .orderBy(orderClause)
      .limit(limit);

    const topSellingProducts = productSalesRows.map((p, idx) => {
      const units = Number(p.unitsSold);
      const rev = Number(p.totalRevenue);
      const stock = Number(p.currentStock);
      const threshold = Number(p.lowStockThreshold);
      const shareOfUnits = summary.totalUnitsSold > 0 ? (units / summary.totalUnitsSold) * 100 : 0;
      const shareOfRev = summary.totalRevenue > 0 ? (rev / summary.totalRevenue) * 100 : 0;

      return {
        rank: idx + 1,
        productId: p.productId,
        name: p.productName || 'Unknown Product',
        sku: p.sku || 'N/A',
        brand: p.brand || 'Crown',
        bikeModel: p.bikeModel || 'Universal',
        category: p.category || 'General',
        unitsSold: units,
        totalRevenue: rev,
        averageRate: Math.round(Number(p.averageRate) || 0),
        ordersCount: Number(p.ordersCount),
        currentStock: stock,
        lowStockThreshold: threshold,
        isLowStock: stock <= threshold,
        shareOfUnits: Math.round(shareOfUnits * 10) / 10,
        shareOfRev: Math.round(shareOfRev * 10) / 10,
      };
    });

    // 3. Highlight Winners for KPIs
    const topByVolume = [...topSellingProducts].sort((a, b) => b.unitsSold - a.unitsSold)[0] || null;
    const topByRevenue = [...topSellingProducts].sort((a, b) => b.totalRevenue - a.totalRevenue)[0] || null;
    const topByFrequency = [...topSellingProducts].sort((a, b) => b.ordersCount - a.ordersCount)[0] || null;

    // 4. Top 8 Highest-Value Invoices in this Period (Most Sealed Large Orders)
    const topOrdersRows = await db
      .select({
        id: orders.id,
        invoiceNumber: orders.invoiceNumber,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        customerCity: orders.customerCity,
        orderType: orders.orderType,
        orderStatus: orders.orderStatus,
        paymentMethod: orders.paymentMethod,
        totalAmount: sql<number>`${orders.totalAmount}::numeric`,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(whereClause)
      .orderBy(desc(sql`${orders.totalAmount}::numeric`))
      .limit(8);

    const topOrders = topOrdersRows.map((o) => ({
      id: o.id,
      invoiceNumber: o.invoiceNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone || 'N/A',
      customerCity: o.customerCity || 'Karachi',
      orderType: o.orderType,
      orderStatus: o.orderStatus,
      paymentMethod: o.paymentMethod,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt,
    }));

    // 5. Category Breakdown
    const categoryRows = await db
      .select({
        category: orderItems.category,
        totalUnits: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::integer`,
        totalRevenue: sql<number>`COALESCE(SUM(${orderItems.lineTotal}::numeric), 0)::numeric`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(whereClause)
      .groupBy(orderItems.category)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(6);

    const categoryBreakdown = categoryRows.map((c) => ({
      category: c.category || 'General',
      totalUnits: Number(c.totalUnits),
      totalRevenue: Number(c.totalRevenue),
    }));

    // 6. Bike Model Breakdown
    const bikeModelRows = await db
      .select({
        bikeModel: orderItems.bikeModel,
        totalUnits: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::integer`,
        totalRevenue: sql<number>`COALESCE(SUM(${orderItems.lineTotal}::numeric), 0)::numeric`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(whereClause)
      .groupBy(orderItems.bikeModel)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(6);

    const bikeModelBreakdown = bikeModelRows.map((b) => ({
      bikeModel: b.bikeModel || 'Universal',
      totalUnits: Number(b.totalUnits),
      totalRevenue: Number(b.totalRevenue),
    }));

    return NextResponse.json({
      success: true,
      data: {
        filter: {
          timeRange,
          sortBy,
          category: category || 'all',
          bikeModel: bikeModel || 'all',
          branchId: branchId || 'all',
          limit,
        },
        summary,
        highlights: {
          topByVolume,
          topByRevenue,
          topByFrequency,
        },
        topSellingProducts,
        topOrders,
        categoryBreakdown,
        bikeModelBreakdown,
      },
    });
  } catch (error: any) {
    console.error('GET /api/reports/top-selling error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch top-selling reports' },
      { status: 500 }
    );
  }
}
