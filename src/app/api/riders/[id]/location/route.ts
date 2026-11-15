import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { deliveryRiders, riderLocationLogs } from '@/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const logs = await db
      .select()
      .from(riderLocationLogs)
      .where(eq(riderLocationLogs.riderId, id))
      .orderBy(desc(riderLocationLogs.recordedAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      data: logs.map((l) => ({
        id: l.id,
        lat: Number(l.latitude),
        lng: Number(l.longitude),
        speed: l.speedKmh ? Number(l.speedKmh) : 0,
        time: l.recordedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('GET /api/riders/[id]/location error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rider location logs' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: riderId } = await params;
    const body = await req.json();
    const { latitude, longitude, speedKmh = 0, status } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Latitude and Longitude are required' },
        { status: 400 }
      );
    }

    const logId = `RLL-${Date.now()}`;
    const now = new Date();

    await db.insert(riderLocationLogs).values({
      id: logId,
      riderId,
      latitude: String(latitude),
      longitude: String(longitude),
      speedKmh: speedKmh ? String(speedKmh) : '0.00',
      recordedAt: now,
    });

    const updatePayload: Record<string, any> = {
      currentLatitude: String(latitude),
      currentLongitude: String(longitude),
      lastPingAt: now,
    };

    if (status) {
      updatePayload.currentStatus = status;
    }

    await db
      .update(deliveryRiders)
      .set(updatePayload)
      .where(eq(deliveryRiders.id, riderId));

    return NextResponse.json({
      success: true,
      data: {
        riderId,
        lat: latitude,
        lng: longitude,
        recordedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('POST /api/riders/[id]/location error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update rider location' },
      { status: 500 }
    );
  }
}
