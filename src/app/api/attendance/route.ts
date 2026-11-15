import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { attendanceRecords, teamMembers, branches } from '@/schema';
import { sql, and, eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
    const offset = (page - 1) * pageSize;

    const dateParam = searchParams.get('date');
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');

    const today = new Date().toISOString().split('T')[0];
    const targetDate = dateParam || today;

    // Automatically ensure all active team members have an attendance record for today
    if (targetDate === today) {
      try {
        const activeMembers = await db
          .select({
            id: teamMembers.id,
            branchId: teamMembers.branchId,
          })
          .from(teamMembers)
          .where(eq(teamMembers.status, 'active'));

        if (activeMembers.length > 0) {
          const existingToday = await db
            .select({ employeeId: attendanceRecords.employeeId })
            .from(attendanceRecords)
            .where(eq(attendanceRecords.attendanceDate, today));

          const existingSet = new Set(existingToday.map((r) => r.employeeId));
          const missing = activeMembers.filter((m) => !existingSet.has(m.id));

          if (missing.length > 0) {
            await db.insert(attendanceRecords).values(
              missing.map((m) => ({
                id: `ATT-${m.id}-${today}`,
                employeeId: m.id,
                branchId: m.branchId || 'main',
                attendanceDate: today,
                status: 'present',
                checkInTime: '09:00 AM',
                checkOutTime: '--',
                shiftTiming: '09:00 AM - 07:00 PM',
                overtimeHours: '0.00',
                notes: 'Auto rostered',
                createdAt: new Date(),
              }))
            );
          }
        }
      } catch (e) {
        console.warn('Roster sync warning in GET /api/attendance:', e);
      }
    }

    const conditions = [];

    if (dateParam) {
      conditions.push(eq(attendanceRecords.attendanceDate, dateParam));
    }

    if (branchId && branchId !== 'all') {
      conditions.push(eq(attendanceRecords.branchId, branchId));
    }

    if (status && status !== 'all') {
      conditions.push(eq(attendanceRecords.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendanceRecords)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch items
    const rows = await db
      .select({
        id: attendanceRecords.id,
        employeeId: attendanceRecords.employeeId,
        employeeName: teamMembers.name,
        employeeRole: teamMembers.role,
        branchId: attendanceRecords.branchId,
        branchName: branches.name,
        attendanceDate: attendanceRecords.attendanceDate,
        status: attendanceRecords.status,
        checkInTime: attendanceRecords.checkInTime,
        checkOutTime: attendanceRecords.checkOutTime,
        shiftTiming: attendanceRecords.shiftTiming,
        overtimeHours: attendanceRecords.overtimeHours,
        notes: attendanceRecords.notes,
      })
      .from(attendanceRecords)
      .leftJoin(teamMembers, eq(attendanceRecords.employeeId, teamMembers.id))
      .leftJoin(branches, eq(attendanceRecords.branchId, branches.id))
      .where(whereClause)
      .orderBy(desc(attendanceRecords.attendanceDate), desc(attendanceRecords.createdAt))
      .limit(pageSize)
      .offset(offset);

    const formatted = rows.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      branchId: r.branchId,
      name: r.employeeName || 'Staff Member',
      role: r.employeeRole || 'Employee',
      branch: r.branchName || 'Saddar Branch',
      date: r.attendanceDate,
      status: r.status,
      checkIn: r.checkInTime,
      checkOut: r.checkOutTime,
      shift: r.shiftTiming,
      overtime: Number(r.overtimeHours || 0),
      notes: r.notes || '',
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('GET /api/attendance error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      employeeId,
      branchId = 'main',
      attendanceDate = new Date().toISOString().split('T')[0],
      status = 'present',
      checkInTime = '09:00 AM',
      checkOutTime = '--',
      shiftTiming = '09:00 AM - 07:00 PM',
      overtimeHours = 0,
      notes = '',
    } = body;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const recordId = `ATT-${employeeId}-${attendanceDate}`;

    // Check if record exists for this employee and date
    const existing = await db.query.attendanceRecords.findFirst({
      where: and(
        eq(attendanceRecords.employeeId, employeeId),
        eq(attendanceRecords.attendanceDate, attendanceDate)
      ),
    });

    if (existing) {
      await db
        .update(attendanceRecords)
        .set({
          status,
          checkInTime,
          checkOutTime,
          shiftTiming,
          overtimeHours: parseFloat(overtimeHours).toFixed(2),
          notes,
        })
        .where(eq(attendanceRecords.id, existing.id));

      return NextResponse.json({
        success: true,
        message: 'Attendance record updated successfully',
      });
    }

    await db.insert(attendanceRecords).values({
      id: recordId,
      employeeId,
      branchId,
      attendanceDate,
      status,
      checkInTime,
      checkOutTime,
      shiftTiming,
      overtimeHours: parseFloat(overtimeHours).toFixed(2),
      notes,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { id: recordId },
      message: 'Attendance logged successfully',
    });
  } catch (error) {
    console.error('POST /api/attendance error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log attendance' },
      { status: 500 }
    );
  }
}
