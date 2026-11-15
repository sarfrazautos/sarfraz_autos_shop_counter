import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tradeSchemes, products } from '@/schema';
import { sql, and, eq, ilike, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = 12; // STRICT REQUIREMENT: 12 ITEMS PER PAGE
    const offset = (page - 1) * pageSize;

    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const schemeType = searchParams.get('type');

    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${tradeSchemes.title} ILIKE ${`%${search}%`} OR ${products.name} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`})`
      );
    }

    if (status && status !== 'all' && status !== 'All') {
      conditions.push(eq(tradeSchemes.status, status));
    }

    if (schemeType && schemeType !== 'all' && schemeType !== 'All') {
      conditions.push(eq(tradeSchemes.schemeType, schemeType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tradeSchemes)
      .leftJoin(products, eq(tradeSchemes.productId, products.id))
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Query 12 items
    const rows = await db
      .select({
        id: tradeSchemes.id,
        productId: tradeSchemes.productId,
        productName: products.name,
        productSku: products.sku,
        productCategory: products.category,
        productBikeModel: products.bikeModel,
        regularWholesalePrice: products.wholesalePrice,
        title: tradeSchemes.title,
        schemeType: tradeSchemes.schemeType,
        buyQuantity: tradeSchemes.buyQuantity,
        freeQuantity: tradeSchemes.freeQuantity,
        netSchemeRate: tradeSchemes.netSchemeRate,
        applicableTier: tradeSchemes.applicableTier,
        validFrom: tradeSchemes.validFrom,
        validTo: tradeSchemes.validTo,
        status: tradeSchemes.status,
        remarks: tradeSchemes.remarks,
        createdAt: tradeSchemes.createdAt,
      })
      .from(tradeSchemes)
      .leftJoin(products, eq(tradeSchemes.productId, products.id))
      .where(whereClause)
      .orderBy(desc(tradeSchemes.createdAt))
      .limit(pageSize)
      .offset(offset);

    const formatted = rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.productName || 'Unknown Product',
      productSku: r.productSku || '',
      category: r.productCategory || 'General',
      bikeModel: r.productBikeModel || 'Universal',
      title: r.title,
      type: r.schemeType as 'buy_x_get_y' | 'net_rate',
      buyQuantity: r.buyQuantity,
      freeQuantity: r.freeQuantity,
      regularWholesalePrice: Number(r.regularWholesalePrice || 0),
      netSchemeRate: r.netSchemeRate ? Number(r.netSchemeRate) : null,
      applicableTier: r.applicableTier,
      validFrom: r.validFrom.toISOString().split('T')[0],
      validTo: r.validTo.toISOString().split('T')[0],
      status: r.status as 'Active' | 'Paused' | 'Expired',
      remarks: r.remarks || '',
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
    console.error('GET /api/trade-schemes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trade schemes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      title,
      type = 'buy_x_get_y',
      buyQuantity = 20,
      freeQuantity = 1,
      netSchemeRate = null,
      applicableTier = 'Wholesale Only',
      validFrom,
      validTo,
      status = 'Active',
      remarks = '',
    } = body;

    if (!productId || !title || !validFrom || !validTo) {
      return NextResponse.json(
        { success: false, error: 'Product ID, Title, Valid From, and Valid To are required' },
        { status: 400 }
      );
    }

    const schemeId = `SCH-${Date.now().toString(36).toUpperCase()}`;

    await db.insert(tradeSchemes).values({
      id: schemeId,
      productId,
      title,
      schemeType: type,
      buyQuantity: parseInt(buyQuantity, 10) || 1,
      freeQuantity: parseInt(freeQuantity, 10) || 0,
      netSchemeRate: netSchemeRate ? String(netSchemeRate) : null,
      applicableTier,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      status,
      remarks,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { id: schemeId },
      message: 'Trade promotional scheme created successfully',
    });
  } catch (error) {
    console.error('POST /api/trade-schemes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create trade scheme' },
      { status: 500 }
    );
  }
}
