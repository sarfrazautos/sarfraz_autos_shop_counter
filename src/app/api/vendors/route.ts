import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vendors } from '@/schema';
import { sql, and, eq, ilike, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = 12;
    const offset = (page - 1) * pageSize;

    const search = searchParams.get('search')?.trim();
    const city = searchParams.get('city');
    const status = searchParams.get('status');

    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${vendors.name} ILIKE ${`%${search}%`} OR ${vendors.phone} ILIKE ${`%${search}%`} OR ${vendors.contactPerson} ILIKE ${`%${search}%`} OR ${vendors.city} ILIKE ${`%${search}%`})`
      );
    }

    if (city && city !== 'all' && city !== 'All') {
      conditions.push(eq(vendors.city, city));
    }

    if (status && status !== 'all' && status !== 'All') {
      conditions.push(eq(vendors.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(vendors)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    const rows = await db
      .select()
      .from(vendors)
      .where(whereClause)
      .orderBy(desc(vendors.createdAt))
      .limit(pageSize)
      .offset(offset);

    const formatted = rows.map((v) => ({
      id: v.id,
      name: v.name,
      contactPerson: v.contactPerson || '',
      phone: v.phone,
      email: v.email || '',
      city: v.city,
      address: v.address || '',
      openingBalance: parseFloat(v.openingBalance || '0'),
      currentBalance: parseFloat(v.currentBalance || '0'),
      status: v.status,
      createdAt: v.createdAt,
    }));

    return NextResponse.json({
      vendors: formatted,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, contactPerson, phone, email, city, address, openingBalance } = body;

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Vendor name and phone are required' }, { status: 400 });
    }

    const id = `VND-${Math.floor(1000 + Math.random() * 9000)}`;
    const opBal = parseFloat(openingBalance || '0') || 0;

    const [newVendor] = await db
      .insert(vendors)
      .values({
        id,
        name: name.trim(),
        contactPerson: contactPerson?.trim() || null,
        phone: phone.trim(),
        email: email?.trim() || null,
        city: city?.trim() || 'Karachi',
        address: address?.trim() || null,
        openingBalance: opBal.toFixed(2),
        currentBalance: opBal.toFixed(2),
        status: 'Active',
      })
      .returning();

    return NextResponse.json({
      vendor: {
        ...newVendor,
        openingBalance: parseFloat(newVendor.openingBalance),
        currentBalance: parseFloat(newVendor.currentBalance),
      },
      message: 'Vendor created successfully',
    });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: error.message || 'Failed to create vendor' }, { status: 500 });
  }
}
