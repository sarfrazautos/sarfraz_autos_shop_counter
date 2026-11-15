import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { deliveryRiders, riderLocationLogs, orders } from '@/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rider = await db.query.deliveryRiders.findFirst({
      where: eq(deliveryRiders.id, id),
      with: {
        activeOrder: true,
      },
    });

    if (!rider) {
      return NextResponse.json(
        { success: false, error: 'Rider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehicleNumber: rider.vehicleNumber,
        currentStatus: rider.currentStatus,
        currentLatitude: Number(rider.currentLatitude),
        currentLongitude: Number(rider.currentLongitude),
        lastPingAt: rider.lastPingAt.toISOString(),
        activeOrder: rider.activeOrder
          ? {
              id: rider.activeOrder.id,
              invoiceNumber: rider.activeOrder.invoiceNumber,
              customerName: rider.activeOrder.customerName,
              customerPhone: rider.activeOrder.customerPhone,
              customerCity: rider.activeOrder.customerCity,
              totalAmount: Number(rider.activeOrder.totalAmount),
              orderStatus: rider.activeOrder.orderStatus,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('GET /api/riders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rider' },
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
    const body = await req.json();
    const { currentStatus, activeOrderId } = body;

    const updatePayload: Record<string, any> = {
      lastPingAt: new Date(),
    };

    if (currentStatus !== undefined) {
      updatePayload.currentStatus = currentStatus;
    }

    if (activeOrderId !== undefined) {
      updatePayload.activeOrderId = activeOrderId;
    }

    await db
      .update(deliveryRiders)
      .set(updatePayload)
      .where(eq(deliveryRiders.id, id));

    return NextResponse.json({
      success: true,
      message: 'Rider updated successfully',
    });
  } catch (error) {
    console.error('PATCH /api/riders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update rider' },
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

    const existing = await db.query.deliveryRiders.findFirst({
      where: eq(deliveryRiders.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Rider not found' },
        { status: 404 }
      );
    }

    // Delete location logs if any
    await db.delete(riderLocationLogs).where(eq(riderLocationLogs.riderId, id)).catch(() => {});

    // Delete rider
    await db.delete(deliveryRiders).where(eq(deliveryRiders.id, id));

    return NextResponse.json({
      success: true,
      message: 'Rider deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/riders/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete rider' },
      { status: 500 }
    );
  }
}
