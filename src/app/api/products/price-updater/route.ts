import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productPriceHistory } from '@/schema';
import { eq, inArray } from 'drizzle-orm';

interface PriceUpdateItem {
  id: string;
  newPrice: number;
  field?: 'wholesale' | 'retail' | 'cost';
  reason?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updates: PriceUpdateItem[] = body.updates || [];

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No price updates provided' },
        { status: 400 }
      );
    }

    const productIds = updates.map((u) => u.id);
    const existingProducts = await db.query.products.findMany({
      where: inArray(products.id, productIds),
    });

    const existingMap = new Map(existingProducts.map((p) => [p.id, p]));
    const historyRows = [];

    for (const update of updates) {
      const existing = existingMap.get(update.id);
      if (!existing) continue;

      const field = update.field || 'wholesale';
      const newPriceStr = update.newPrice.toFixed(2);

      let updatePayload: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (field === 'retail') {
        updatePayload.retailPrice = newPriceStr;
      } else if (field === 'cost') {
        updatePayload.costPrice = newPriceStr;
      } else {
        updatePayload.wholesalePrice = newPriceStr;
      }

      await db
        .update(products)
        .set(updatePayload)
        .where(eq(products.id, update.id));

      historyRows.push({
        id: `HIST-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: update.id,
        oldCostPrice: existing.costPrice,
        newCostPrice: field === 'cost' ? newPriceStr : existing.costPrice,
        oldWholesalePrice: existing.wholesalePrice,
        newWholesalePrice: field === 'wholesale' ? newPriceStr : existing.wholesalePrice,
        oldRetailPrice: existing.retailPrice,
        newRetailPrice: field === 'retail' ? newPriceStr : existing.retailPrice,
        reason: update.reason || 'Bulk price update execution',
        changedByUserId: 'admin@sarfrazautos-counter.com',
        createdAt: new Date(),
      });
    }

    if (historyRows.length > 0) {
      await db.insert(productPriceHistory).values(historyRows);
    }

    return NextResponse.json({
      success: true,
      updatedCount: historyRows.length,
      message: `Successfully updated prices for ${historyRows.length} items.`,
    });
  } catch (error) {
    console.error('POST /api/products/price-updater error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute bulk price updates' },
      { status: 500 }
    );
  }
}
