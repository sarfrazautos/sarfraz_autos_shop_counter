import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, purchaseItems } from '@/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId parameter is required' }, { status: 400 });
    }

    const lastItem = await db
      .select({
        purchaseRate: purchaseItems.purchaseRate,
        quantity: purchaseItems.quantity,
        freeQuantity: purchaseItems.freeQuantity,
        isNetScheme: purchaseItems.isNetScheme,
        schemeNote: purchaseItems.schemeNote,
        vendorName: purchases.vendorName,
        invoiceNumber: purchases.invoiceNumber,
        purchaseDate: purchases.purchaseDate,
      })
      .from(purchaseItems)
      .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
      .where(eq(purchaseItems.productId, productId))
      .orderBy(desc(purchases.purchaseDate))
      .limit(1);

    if (lastItem.length === 0) {
      return NextResponse.json({ hasHistory: false });
    }

    const record = lastItem[0];
    return NextResponse.json({
      hasHistory: true,
      lastRate: parseFloat(record.purchaseRate || '0'),
      quantity: record.quantity,
      freeQuantity: record.freeQuantity,
      isNetScheme: record.isNetScheme,
      schemeNote: record.schemeNote || (record.freeQuantity > 0 ? `${record.quantity}+${record.freeQuantity} Free` : record.isNetScheme ? 'Net Scheme' : 'Standard Rate'),
      vendorName: record.vendorName,
      invoiceNumber: record.invoiceNumber,
      purchaseDate: record.purchaseDate,
    });
  } catch (error: any) {
    console.error('Error fetching last purchase rate:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch last rate' }, { status: 500 });
  }
}
