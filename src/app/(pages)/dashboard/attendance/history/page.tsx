import { AppShell } from "@/components/app-shell";
import { AttendanceHistoryView } from "@/components/Attendance/attendance-history-view";

export default function AttendanceHistoryPage() {
	return (
		<AppShell pathname="/dashboard/attendance/history">
			<AttendanceHistoryView />
		</AppShell>
	);
}

