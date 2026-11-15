export interface AttendanceItem {
  id: string;
  employeeId: string;
  branchId?: string;
  name: string;
  role: string;
  branch: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  shift: string;
  overtime: number;
  notes: string;
}

export interface AttendanceResponse {
  success: boolean;
  data: AttendanceItem[];
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

export interface FetchAttendanceParams {
  page?: number;
  date?: string;
  branchId?: string;
  status?: string;
}

export async function fetchAttendanceRecords(params: FetchAttendanceParams = {}): Promise<AttendanceResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.date) query.set('date', params.date);
  if (params.branchId && params.branchId !== 'all') query.set('branchId', params.branchId);
  if (params.status && params.status !== 'all') query.set('status', params.status);

  const res = await fetch(`/api/attendance?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch attendance records');
  }

  return res.json();
}

export async function markAttendance(payload: {
  employeeId: string;
  branchId?: string;
  attendanceDate?: string;
  status: 'present' | 'late' | 'half-day' | 'absent' | 'on-leave';
  checkInTime?: string;
  checkOutTime?: string;
  shiftTiming?: string;
  overtimeHours?: number;
  notes?: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to mark attendance');
  }

  return res.json();
}
