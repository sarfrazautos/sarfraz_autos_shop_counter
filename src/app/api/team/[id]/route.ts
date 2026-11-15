import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teamMembers } from '@/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, id),
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error('GET /api/team/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team member' },
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

    const existing = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      );
    }

    const { name, role, email, phone, branchId, status, avatarUrl } = body;
    const updatePayload: Record<string, any> = {};
    if (name !== undefined) updatePayload.name = name;
    if (role !== undefined) updatePayload.role = role;
    if (email !== undefined) updatePayload.email = email;
    if (phone !== undefined) updatePayload.phone = phone;
    if (branchId !== undefined) updatePayload.branchId = branchId;
    if (status !== undefined) updatePayload.status = status;
    if (avatarUrl !== undefined) updatePayload.avatarUrl = avatarUrl;

    await db.update(teamMembers).set(updatePayload).where(eq(teamMembers.id, id));

    return NextResponse.json({
      success: true,
      message: 'Team member updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/team/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team member' },
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

    const existing = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      );
    }

    await db.delete(teamMembers).where(eq(teamMembers.id, id));

    return NextResponse.json({
      success: true,
      message: 'Team member deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/team/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}
