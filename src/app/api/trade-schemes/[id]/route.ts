import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tradeSchemes, products } from '@/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      })
      .from(tradeSchemes)
      .leftJoin(products, eq(tradeSchemes.productId, products.id))
      .where(eq(tradeSchemes.id, id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Trade scheme not found' },
        { status: 404 }
      );
    }

    const r = rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: r.id,
        productId: r.productId,
        productName: r.productName,
        productSku: r.productSku,
        category: r.productCategory,
        bikeModel: r.productBikeModel,
        regularWholesalePrice: Number(r.regularWholesalePrice || 0),
        title: r.title,
        type: r.schemeType as 'buy_x_get_y' | 'net_rate',
        buyQuantity: r.buyQuantity,
        freeQuantity: r.freeQuantity,
        netSchemeRate: r.netSchemeRate ? Number(r.netSchemeRate) : null,
        applicableTier: r.applicableTier,
        validFrom: r.validFrom.toISOString().split('T')[0],
        validTo: r.validTo.toISOString().split('T')[0],
        status: r.status as 'Active' | 'Paused' | 'Expired',
        remarks: r.remarks || '',
      },
    });
  } catch (error) {
    console.error('GET /api/trade-schemes/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trade scheme' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.query.tradeSchemes.findFirst({
      where: eq(tradeSchemes.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Trade scheme not found' },
        { status: 404 }
      );
    }

    const {
      title,
      type,
      buyQuantity,
      freeQuantity,
      netSchemeRate,
      applicableTier,
      validFrom,
      validTo,
      status,
      remarks,
    } = body;

    const updatePayload: Record<string, any> = {};
    if (title !== undefined) updatePayload.title = title;
    if (type !== undefined) updatePayload.schemeType = type;
    if (buyQuantity !== undefined) updatePayload.buyQuantity = parseInt(buyQuantity, 10);
    if (freeQuantity !== undefined) updatePayload.freeQuantity = parseInt(freeQuantity, 10);
    if (netSchemeRate !== undefined)
      updatePayload.netSchemeRate = netSchemeRate ? String(netSchemeRate) : null;
    if (applicableTier !== undefined) updatePayload.applicableTier = applicableTier;
    if (validFrom !== undefined) updatePayload.validFrom = new Date(validFrom);
    if (validTo !== undefined) updatePayload.validTo = new Date(validTo);
    if (status !== undefined) updatePayload.status = status;
    if (remarks !== undefined) updatePayload.remarks = remarks;

    await db.update(tradeSchemes).set(updatePayload).where(eq(tradeSchemes.id, id));

    return NextResponse.json({
      success: true,
      message: 'Trade scheme updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/trade-schemes/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update trade scheme' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.query.tradeSchemes.findFirst({
      where: eq(tradeSchemes.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Trade scheme not found' },
        { status: 404 }
      );
    }

    await db.delete(tradeSchemes).where(eq(tradeSchemes.id, id));

    return NextResponse.json({
      success: true,
      message: 'Trade scheme deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/trade-schemes/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete trade scheme' },
      { status: 500 }
    );
  }
}
