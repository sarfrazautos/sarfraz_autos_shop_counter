import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, productBranchStock, productPriceHistory } from '@/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prod = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        branchStock: true,
      },
    });

    if (!prod) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const branchesList = prod.branchStock.map((bs) => ({
      branchId: bs.branchId as 'main' | 'branch-2' | 'branch-3',
      branchName:
        bs.branchId === 'main'
          ? '1st Branch (Saddar)'
          : bs.branchId === 'branch-2'
          ? '2nd Branch (Gulshan)'
          : '3rd Branch (DHA)',
      stock: bs.stockQuantity,
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        type: prod.listingType,
        bikeModel: prod.bikeModel,
        price: Number(prod.wholesalePrice),
        costPrice: Number(prod.costPrice),
        retailPrice: Number(prod.retailPrice),
        totalStock: prod.totalStock,
        lowStockThreshold: prod.lowStockThreshold,
        unit: prod.unit,
        imageUrl: prod.imageUrl || '/logo.png',
        status: prod.status,
        branches: branchesList,
      },
    });
  } catch (error) {
    console.error('GET /api/products/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
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

    const existing = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const {
      name,
      category,
      listingType,
      bikeModel,
      costPrice,
      retailPrice,
      wholesalePrice,
      totalStock,
      lowStockThreshold,
      status,
      imageUrl,
      saddarStock,
      gulshanStock,
      dhaStock,
    } = body;

    // Check if price changed to record history
    if (
      wholesalePrice !== undefined &&
      Number(wholesalePrice) !== Number(existing.wholesalePrice)
    ) {
      await db.insert(productPriceHistory).values({
        id: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: id,
        oldCostPrice: existing.costPrice,
        newCostPrice: costPrice !== undefined ? String(costPrice) : existing.costPrice,
        oldWholesalePrice: existing.wholesalePrice,
        newWholesalePrice: String(wholesalePrice),
        oldRetailPrice: existing.retailPrice,
        newRetailPrice: retailPrice !== undefined ? String(retailPrice) : existing.retailPrice,
        reason: 'Product Edit Form Update',
      });
    }

    // Update product
    await db
      .update(products)
      .set({
        name: name !== undefined ? name : existing.name,
        category: category !== undefined ? category : existing.category,
        listingType: listingType !== undefined ? listingType : existing.listingType,
        bikeModel: bikeModel !== undefined ? bikeModel : existing.bikeModel,
        costPrice: costPrice !== undefined ? String(costPrice) : existing.costPrice,
        retailPrice: retailPrice !== undefined ? String(retailPrice) : existing.retailPrice,
        wholesalePrice: wholesalePrice !== undefined ? String(wholesalePrice) : existing.wholesalePrice,
        totalStock: totalStock !== undefined ? Number(totalStock) : existing.totalStock,
        lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : existing.lowStockThreshold,
        status: status !== undefined ? status : existing.status,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    // Update branch stocks if provided
    if (saddarStock !== undefined) {
      await db
        .insert(productBranchStock)
        .values({
          id: `pbs_${id}_main`,
          productId: id,
          branchId: 'main',
          stockQuantity: Number(saddarStock),
        })
        .onConflictDoUpdate({
          target: productBranchStock.id,
          set: { stockQuantity: Number(saddarStock), updatedAt: new Date() },
        });
    }

    if (gulshanStock !== undefined) {
      await db
        .insert(productBranchStock)
        .values({
          id: `pbs_${id}_branch-2`,
          productId: id,
          branchId: 'branch-2',
          stockQuantity: Number(gulshanStock),
        })
        .onConflictDoUpdate({
          target: productBranchStock.id,
          set: { stockQuantity: Number(gulshanStock), updatedAt: new Date() },
        });
    }

    if (dhaStock !== undefined) {
      await db
        .insert(productBranchStock)
        .values({
          id: `pbs_${id}_branch-3`,
          productId: id,
          branchId: 'branch-3',
          stockQuantity: Number(dhaStock),
        })
        .onConflictDoUpdate({
          target: productBranchStock.id,
          set: { stockQuantity: Number(dhaStock), updatedAt: new Date() },
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
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
    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
