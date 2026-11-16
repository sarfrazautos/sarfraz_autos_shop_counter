import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, productBranchStock, products } from '@/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Strip '#' if provided
    const cleanId = id.replace(/^#/, '');

    const order = await db.query.orders.findFirst({
      where: (table, { or, eq }) => or(eq(table.id, cleanId), eq(table.invoiceNumber, cleanId)),
      with: {
        items: true,
        branch: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = id.replace(/^#/, '');
    const body = await req.json();
    const { status, remarks } = body;

    const existing = await db.query.orders.findFirst({
      where: (table, { or, eq }) => or(eq(table.id, cleanId), eq(table.invoiceNumber, cleanId)),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const updatePayload: Record<string, any> = {};
    if (status !== undefined) updatePayload.orderStatus = status;
    if (remarks !== undefined) updatePayload.remarks = remarks;

    await db
      .update(orders)
      .set(updatePayload)
      .where(eq(orders.id, existing.id));

    return NextResponse.json({
      success: true,
      message: `Order #${existing.invoiceNumber} status updated to ${status}`,
    });
  } catch (error) {
    console.error('PATCH /api/orders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
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
    const cleanId = id.replace(/^#/, '');

    const order = await db.query.orders.findFirst({
      where: (table, { or, eq }) => or(eq(table.id, cleanId), eq(table.invoiceNumber, cleanId)),
      with: {
        items: true,
        branch: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Restore stock if previously deducted
    for (const item of order.items) {
      if (item.productId) {
        const bs = await db.query.productBranchStock.findFirst({
          where: and(
            eq(productBranchStock.productId, item.productId),
            eq(productBranchStock.branchId, order.branchId)
          ),
        });

        if (bs) {
          const newQty = bs.stockQuantity + item.quantity;
          await db
            .update(productBranchStock)
            .set({ stockQuantity: newQty, updatedAt: new Date() })
            .where(eq(productBranchStock.id, bs.id));

          const allBS = await db.query.productBranchStock.findMany({
            where: eq(productBranchStock.productId, item.productId),
          });
          const newTotal = allBS.reduce((sum, b) => sum + b.stockQuantity, 0);

          await db
            .update(products)
            .set({ totalStock: newTotal, updatedAt: new Date() })
            .where(eq(products.id, item.productId));
        }
      }
    }

    // Set order status to Cancelled
    await db
      .update(orders)
      .set({ orderStatus: 'Cancelled' })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      success: true,
      message: `Order #${order.invoiceNumber} has been cancelled and branch stock restored.`,
    });
  } catch (error) {
    console.error('DELETE /api/orders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
