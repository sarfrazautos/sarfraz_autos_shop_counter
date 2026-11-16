import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vendors } from '@/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, id),
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      vendor: {
        ...vendor,
        openingBalance: parseFloat(vendor.openingBalance || '0'),
        currentBalance: parseFloat(vendor.currentBalance || '0'),
      },
    });
  } catch (error: any) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vendor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, contactPerson, phone, email, city, address, status } = body;

    const [updated] = await db
      .update(vendors)
      .set({
        name: name?.trim(),
        contactPerson: contactPerson?.trim() || null,
        phone: phone?.trim(),
        email: email?.trim() || null,
        city: city?.trim(),
        address: address?.trim() || null,
        status: status || 'Active',
      })
      .where(eq(vendors.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      vendor: {
        ...updated,
        openingBalance: parseFloat(updated.openingBalance || '0'),
        currentBalance: parseFloat(updated.currentBalance || '0'),
      },
      message: 'Vendor updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    return NextResponse.json({ error: error.message || 'Failed to update vendor' }, { status: 500 });
  }
}
