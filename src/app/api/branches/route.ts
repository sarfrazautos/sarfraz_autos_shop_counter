import { NextResponse } from 'next/server';
import { db } from '@/db';
import { branches } from '@/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const branchList = await db.query.branches.findMany({
      where: eq(branches.isActive, true),
    });

    return NextResponse.json({
      success: true,
      data: branchList.map((b) => ({
        id: b.id,
        name: b.name,
        shortName: b.shortName,
        address: b.address,
        phone: b.phone,
        manager: b.managerName,
        isActive: b.isActive,
      })),
    });
  } catch (error) {
    console.error('GET /api/branches error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}
