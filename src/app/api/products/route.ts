import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productBranchStock } from '@/schema';
import { sql, and, eq, ilike, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const isAll = searchParams.get('all') === 'true';
    const limitParam = searchParams.get('limit');
    const pageSize = isAll ? 5000 : (limitParam ? Math.max(1, parseInt(limitParam, 10)) : 12);
    const offset = isAll ? 0 : (page - 1) * pageSize;

    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category');
    const bikeModel = searchParams.get('bikeModel');
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`} OR ${products.bikeModel} ILIKE ${`%${search}%`})`
      );
    }

    if (category && category !== 'all' && category !== 'All') {
      conditions.push(eq(products.category, category));
    }

    if (bikeModel && bikeModel !== 'all' && bikeModel !== 'All' && bikeModel !== 'All Models') {
      conditions.push(eq(products.bikeModel, bikeModel));
    }

    if (status && status !== 'all' && status !== 'All') {
      conditions.push(eq(products.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Total matching count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    // 2. Fetch 12 items for current page with branch stocks
    const productRows = await db.query.products.findMany({
      where: whereClause,
      limit: pageSize,
      offset: offset,
      orderBy: [desc(products.createdAt)],
      with: {
        branchStock: true,
      },
    });

    // Format for frontend
    const formatted = productRows.map((p) => {
      let branchStockList = p.branchStock.map((bs) => ({
        branchId: bs.branchId as 'main' | 'branch-2' | 'branch-3',
        branchName:
          bs.branchId === 'main'
            ? '1st Branch (Saddar)'
            : bs.branchId === 'branch-2'
            ? '2nd Branch (Gulshan)'
            : '3rd Branch (DHA)',
        stock: bs.stockQuantity,
      }));

      // If filtered by a specific branch
      if (branchId && branchId !== 'all') {
        const specificBranchStock = branchStockList.find((b) => b.branchId === branchId)?.stock ?? 0;
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          type: p.listingType,
          bikeModel: p.bikeModel,
          price: Number(p.wholesalePrice),
          costPrice: Number(p.costPrice),
          retailPrice: Number(p.retailPrice),
          totalStock: p.totalStock,
          branchSpecificStock: specificBranchStock,
          lowStockThreshold: p.lowStockThreshold,
          unit: p.unit,
          imageUrl: p.imageUrl || '/logo.png',
          status: p.status,
          updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
          branches: branchStockList,
        };
      }

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        type: p.listingType,
        bikeModel: p.bikeModel,
        price: Number(p.wholesalePrice),
        costPrice: Number(p.costPrice),
        retailPrice: Number(p.retailPrice),
        totalStock: p.totalStock,
        lowStockThreshold: p.lowStockThreshold,
        unit: p.unit,
        imageUrl: p.imageUrl || '/logo.png',
        status: p.status,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
        branches: branchStockList,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      sku,
      category,
      listingType = 'Wholesale',
      bikeModel,
      costPrice = 0,
      retailPrice = 0,
      wholesalePrice = 0,
      totalStock = 0,
      lowStockThreshold = 15,
      unit = 'Pcs',
      imageUrl = '/logo.png',
      status = 'In Stock',
      saddarStock,
      gulshanStock,
      dhaStock,
    } = body;

    const productId = `PRD-${Date.now().toString().slice(-4)}`;
    const productSku = sku || `CRN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 1. Insert product
    await db.insert(products).values({
      id: productId,
      sku: productSku,
      name,
      category,
      listingType,
      bikeModel,
      costPrice: String(costPrice),
      retailPrice: String(retailPrice),
      wholesalePrice: String(wholesalePrice),
      totalStock: Number(totalStock),
      lowStockThreshold: Number(lowStockThreshold),
      unit,
      imageUrl,
      status: Number(totalStock) === 0 ? 'Out of Stock' : Number(totalStock) <= Number(lowStockThreshold) ? 'Low Stock' : status,
    });

    // 2. Insert branch stocks
    const b1 = saddarStock !== undefined ? Number(saddarStock) : Math.ceil(Number(totalStock) / 3);
    const b2 = gulshanStock !== undefined ? Number(gulshanStock) : Math.floor(Number(totalStock) / 3);
    const b3 = dhaStock !== undefined ? Number(dhaStock) : Number(totalStock) - b1 - b2;

    await db.insert(productBranchStock).values([
      {
        id: `pbs_${productId}_main`,
        productId,
        branchId: 'main',
        stockQuantity: Math.max(0, b1),
      },
      {
        id: `pbs_${productId}_branch-2`,
        productId,
        branchId: 'branch-2',
        stockQuantity: Math.max(0, b2),
      },
      {
        id: `pbs_${productId}_branch-3`,
        productId,
        branchId: 'branch-3',
        stockQuantity: Math.max(0, b3),
      },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: { id: productId, sku: productSku },
    });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
