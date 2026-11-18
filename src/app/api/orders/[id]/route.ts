import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, tradeSchemes } from '@/schema';
import { eq } from 'drizzle-orm';
import type { OrderRecord } from '@/components/Orders/types';

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

    const o = order;

    // Fetch active trade schemes to reconstruct any free bonus units delivered
    const activeSchemes = await db.query.tradeSchemes.findMany({
      where: eq(tradeSchemes.status, 'Active'),
    });
    const schemeByProdId = new Map(activeSchemes.map((s) => [s.productId, s]));

    const itemsList = o.items.map((i) => {
      const sch = schemeByProdId.get(i.productId);
      let freeQuantity = 0;
      if (
        sch &&
        sch.schemeType === 'buy_x_get_y' &&
        sch.buyQuantity > 0 &&
        (i.isSchemeApplied || (o.remarks && o.remarks.includes('Trade Scheme')))
      ) {
        freeQuantity = Math.floor(i.quantity / sch.buyQuantity) * sch.freeQuantity;
      }

      return {
        id: i.id,
        productId: i.productId,
        name: i.productName,
        subLabel: `${i.sku} | ${i.bikeModel}`,
        quantity: i.quantity,
        rate: Number(i.unitRate),
        total: Number(i.lineTotal),
        freeQuantity: freeQuantity > 0 ? freeQuantity : undefined,
        isSchemeApplied: Boolean(i.isSchemeApplied),
      };
    });

    const totalQuantity = o.items.reduce((sum, item) => sum + item.quantity, 0);

    const d = o.createdAt;
    const dateFormatted = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const formatted: OrderRecord = {
      id: `#${o.invoiceNumber}`,
      invoiceNumber: o.invoiceNumber,
      customerName: o.customerName,
      customerCity: o.customerCity,
      customerAddress: `${o.customerCity}, Pakistan`,
      customerPhone: o.customerPhone || 'N/A',
      branchId: o.branchId,
      branchName: o.branch?.name || '1st Branch (Saddar - Main Counter)',
      branchShortName: o.branch?.shortName || 'Saddar Main',
      items: itemsList,
      totalQuantity,
      type: (o.orderType as any) || 'Wholesale',
      subtotalAmount: Number(o.subtotalAmount || o.totalAmount),
      totalAmount: Number(o.subtotalAmount || o.totalAmount),
      discountAmount: Number(o.discountAmount || 0),
      shippingCharges: Number(o.shippingCharges || 0),
      cashReceived: Number(o.cashReceived || 0),
      onlineReceived: Number(o.onlineReceived || 0),
      netBill: Number(o.totalAmount) + Number(o.shippingCharges || 0),
      finalBalance: Number(o.netBalanceAdded || 0),
      status: (o.orderStatus as any) || 'Completed',
      date: dateFormatted,
      dateTimeFull: `${dateFormatted.toUpperCase()} ${timeFormatted}`,
      paymentMethod: o.paymentMethod,
      paymentProofUrl: o.paymentProofUrl,
      godown: o.branch?.name?.toUpperCase() || 'SADDAR MAIN WORKSHOP',
      remarks: o.remarks || '',
    };

    return NextResponse.json({
      success: true,
      data: formatted,
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

    const existing = await db.query.orders.findFirst({
      where: (table, { or, eq }) => or(eq(table.id, cleanId), eq(table.invoiceNumber, cleanId)),
      with: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const updatePayload: Record<string, any> = {};
    if (body.customerName !== undefined) updatePayload.customerName = body.customerName;
    if (body.customerPhone !== undefined) updatePayload.customerPhone = body.customerPhone;
    if (body.customerCity !== undefined) updatePayload.customerCity = body.customerCity;
    if (body.orderType !== undefined) updatePayload.orderType = body.orderType;
    if (body.orderStatus !== undefined) updatePayload.orderStatus = body.orderStatus;
    else if (body.status !== undefined) updatePayload.orderStatus = body.status;
    if (body.paymentMethod !== undefined) updatePayload.paymentMethod = body.paymentMethod;
    if (body.subtotalAmount !== undefined) updatePayload.subtotalAmount = String(body.subtotalAmount);
    if (body.discountAmount !== undefined) updatePayload.discountAmount = String(body.discountAmount);
    if (body.shippingCharges !== undefined) updatePayload.shippingCharges = String(body.shippingCharges);
    if (body.totalAmount !== undefined) updatePayload.totalAmount = String(body.totalAmount);
    if (body.cashReceived !== undefined) updatePayload.cashReceived = String(body.cashReceived);
    if (body.onlineReceived !== undefined) updatePayload.onlineReceived = String(body.onlineReceived);
    if (body.changeReturned !== undefined) updatePayload.changeReturned = String(body.changeReturned);
    if (body.netBalanceAdded !== undefined) updatePayload.netBalanceAdded = String(body.netBalanceAdded);
    if (body.remarks !== undefined) updatePayload.remarks = body.remarks;

    if (Object.keys(updatePayload).length > 0) {
      await db
        .update(orders)
        .set(updatePayload)
        .where(eq(orders.id, existing.id));
    }

    // If items were updated
    if (Array.isArray(body.items) && body.items.length > 0) {
      for (const item of body.items) {
        if (item.id) {
          const qty = Number(item.quantity) || 1;
          const rate = Number(item.rate ?? item.unitRate) || 0;
          const lineTotal = qty * rate;
          await db
            .update(orderItems)
            .set({
              quantity: qty,
              unitRate: String(rate),
              lineTotal: String(lineTotal),
              productName: item.name || undefined,
            })
            .where(eq(orderItems.id, item.id));
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order #${existing.invoiceNumber} successfully updated`,
    });
  } catch (error) {
    console.error('PATCH /api/orders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
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

    // Delete order (cascade deletes order items)
    await db.delete(orders).where(eq(orders.id, order.id));

    return NextResponse.json({
      success: true,
      message: `Order #${order.invoiceNumber} successfully deleted`,
    });
  } catch (error) {
    console.error('DELETE /api/orders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
