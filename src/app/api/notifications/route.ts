import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/schema';
import { sql, and, eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = 12; // STRICT REQUIREMENT: 12 ITEMS PER PAGE
    const offset = (page - 1) * pageSize;

    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unread') === 'true';

    const conditions = [];

    if (type && type !== 'all') {
      conditions.push(eq(notifications.notificationType, type));
    }

    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total Count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(whereClause);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Unread count
    const unreadCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.isRead, false));
    const unreadCount = Number(unreadCountResult[0]?.count || 0);

    // 12 Items
    const rows = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(pageSize)
      .offset(offset);

    const formatted = rows.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      type: n.notificationType,
      isRead: n.isRead,
      isUrgent: n.isUrgent,
      actionUrl: n.actionUrl,
      actionLabel: n.actionLabel,
      time: n.createdAt.toISOString(),
      formattedTime: n.createdAt.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      unreadCount,
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
    console.error('GET /api/notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await db.update(notifications).set({ isRead: true });
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id));

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Must provide either id or markAllRead' },
      { status: 400 }
    );
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      type = 'system',
      branchId = 'main',
      isUrgent = false,
      actionUrl = null,
      actionLabel = null,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and Description are required' },
        { status: 400 }
      );
    }

    const notifId = `NOTIF-${Date.now()}`;

    await db.insert(notifications).values({
      id: notifId,
      title,
      description,
      notificationType: type,
      branchId,
      isRead: false,
      isUrgent,
      actionUrl,
      actionLabel,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { id: notifId },
      message: 'Notification created successfully',
    });
  } catch (error) {
    console.error('POST /api/notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
