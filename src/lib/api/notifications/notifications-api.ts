export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: string;
  isRead: boolean;
  isUrgent: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  time: string;
  formattedTime: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: NotificationItem[];
  unreadCount: number;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  error?: string;
}

export async function fetchNotifications(params: { page?: number; type?: string; unread?: boolean } = {}): Promise<NotificationsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.type && params.type !== 'all') query.set('type', params.type);
  if (params.unread) query.set('unread', 'true');

  const res = await fetch(`/api/notifications?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch notifications');
  }

  return res.json();
}

export async function markNotificationRead(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to mark notification as read');
  }

  return res.json();
}

export async function markAllNotificationsRead(): Promise<{ success: boolean; message?: string }> {
  const res = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markAllRead: true }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to mark all as read');
  }

  return res.json();
}

export async function createNotification(payload: any): Promise<{ success: boolean; data: any }> {
  const res = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create notification');
  }

  return res.json();
}
