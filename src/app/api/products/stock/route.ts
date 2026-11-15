import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productBranchStock } from '@/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, branchId, quantityChange, newQuantity, reason } = body;

    if (!productId || !branchId) {
      return NextResponse.json(
        { success: false, error: 'Product ID and Branch ID are required' },
        { status: 400 }
      );
    }

    // Find the branch stock record
    const existingBranchStock = await db.query.productBranchStock.findFirst({
      where: and(
        eq(productBranchStock.productId, productId),
        eq(productBranchStock.branchId, branchId)
      ),
    });

    let updatedQuantity = 0;
    if (newQuantity !== undefined) {
      updatedQuantity = Math.max(0, parseInt(newQuantity, 10));
    } else if (quantityChange !== undefined) {
      const current = existingBranchStock ? existingBranchStock.stockQuantity : 0;
      updatedQuantity = Math.max(0, current + parseInt(quantityChange, 10));
    } else {
      return NextResponse.json(
        { success: false, error: 'Must provide either newQuantity or quantityChange' },
        { status: 400 }
      );
    }

    if (existingBranchStock) {
      await db
        .update(productBranchStock)
        .set({
          stockQuantity: updatedQuantity,
          updatedAt: new Date(),
        })
        .where(eq(productBranchStock.id, existingBranchStock.id));
    } else {
      await db.insert(productBranchStock).values({
        id: `PBS-${productId}-${branchId}`,
        productId,
        branchId,
        stockQuantity: updatedQuantity,
        updatedAt: new Date(),
      });
    }

    // Recalculate total product stock across all branches
    const allBranchStocks = await db.query.productBranchStock.findMany({
      where: eq(productBranchStock.productId, productId),
    });

    const totalStock = allBranchStocks.reduce((sum, bs) => sum + bs.stockQuantity, 0);

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    const lowStockThreshold = product?.lowStockThreshold ?? 15;
    const newStatus =
      totalStock === 0
        ? 'Out of Stock'
        : totalStock <= lowStockThreshold
        ? 'Low Stock'
        : 'In Stock';

    await db
      .update(products)
      .set({
        totalStock,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    return NextResponse.json({
      success: true,
      data: {
        productId,
        branchId,
        branchStock: updatedQuantity,
        totalStock,
        status: newStatus,
      },
    });
  } catch (error) {
    console.error('POST /api/products/stock error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product stock' },
      { status: 500 }
    );
  }
}
