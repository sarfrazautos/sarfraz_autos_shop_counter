import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { deliveryRiders, orders } from '@/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const riders = await db.query.deliveryRiders.findMany({
      with: {
        activeOrder: true,
      },
    });

    const formatted = riders.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      vehicle: r.vehicleNumber,
      status: r.currentStatus as 'idle' | 'en_route_delivery' | 'offline',
      lat: Number(r.currentLatitude),
      lng: Number(r.currentLongitude),
      activeOrderId: r.activeOrderId,
      activeInvoiceNumber: r.activeOrder?.invoiceNumber || null,
      destinationName: r.activeOrder?.customerName || null,
      destinationCity: r.activeOrder?.customerCity || null,
      lastPing: r.lastPingAt.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('GET /api/riders error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch delivery riders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      vehicleNumber,
      currentStatus = 'idle',
      currentLatitude = 24.8607,
      currentLongitude = 67.0011,
    } = body;

    if (!name || !phone || !vehicleNumber) {
      return NextResponse.json(
        { success: false, error: 'Name, Phone, and Vehicle Number are required' },
        { status: 400 }
      );
    }

    const riderId = `RDR-${Date.now().toString().slice(-4)}`;

    await db.insert(deliveryRiders).values({
      id: riderId,
      name,
      phone,
      vehicleNumber,
      currentStatus,
      currentLatitude: String(currentLatitude),
      currentLongitude: String(currentLongitude),
      lastPingAt: new Date(),
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { id: riderId },
      message: 'Delivery rider added successfully',
    });
  } catch (error) {
    console.error('POST /api/riders error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add rider' },
      { status: 500 }
    );
  }
}
