import type { AttendanceStatus, BranchId } from "./types";

export interface AttendanceHistoryEntry {
	id: string;
	date: string;
	formattedDate: string;
	dayOfWeek: string;
	employeeId: string;
	employeeName: string;
	employeeRole: string;
	avatarUrl?: string;
	branchId: "main" | "branch-2" | "branch-3";
	branchName: string;
	status: AttendanceStatus;
	checkInTime: string;
	checkOutTime: string;
	shiftHours: string;
	notes: string;
}

export const INITIAL_ATTENDANCE_HISTORY: AttendanceHistoryEntry[] = [];
