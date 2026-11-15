import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teamMembers, branches, attendanceRecords } from '@/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');

    const conditions = [];
    if (branchId && branchId !== 'all') {
      conditions.push(eq(teamMembers.branchId, branchId));
    }

    const rows = await db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        role: teamMembers.role,
        email: teamMembers.email,
        phone: teamMembers.phone,
        branchId: teamMembers.branchId,
        branchName: branches.name,
        avatarUrl: teamMembers.avatarUrl,
        status: teamMembers.status,
        joinedDate: teamMembers.joinedDate,
      })
      .from(teamMembers)
      .leftJoin(branches, eq(teamMembers.branchId, branches.id))
      .orderBy(desc(teamMembers.joinedDate));

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('GET /api/team error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      role,
      email,
      phone,
      branchId = 'main',
      avatarUrl = '',
      status = 'active',
    } = body;

    if (!name || !role || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name, Role, Email, and Phone are required' },
        { status: 400 }
      );
    }

    const memberId = `MEM-${Date.now().toString().slice(-4)}`;

    await db.insert(teamMembers).values({
      id: memberId,
      name,
      role,
      email,
      phone,
      branchId,
      avatarUrl,
      status,
      joinedDate: new Date(),
    });

    // Automatically create today's daily attendance record for this person
    const today = new Date().toISOString().split('T')[0];
    const recordId = `ATT-${memberId}-${today}`;
    try {
      await db.insert(attendanceRecords).values({
        id: recordId,
        employeeId: memberId,
        branchId: branchId || 'main',
        attendanceDate: today,
        status: 'present',
        checkInTime: '09:00 AM',
        checkOutTime: '--',
        shiftTiming: '09:00 AM - 07:00 PM',
        overtimeHours: '0.00',
        notes: 'Auto rostered from Team page',
        createdAt: new Date(),
      });
    } catch (attErr) {
      console.warn('Auto-create initial attendance record warning:', attErr);
    }

    return NextResponse.json({
      success: true,
      data: { id: memberId },
      message: 'Team member added successfully',
    });
  } catch (error) {
    console.error('POST /api/team error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}
