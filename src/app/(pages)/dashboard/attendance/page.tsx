import { AppShell } from "@/components/app-shell";
import { AttendanceView } from "@/components/Attendance/attendance-view";

export default function AttendancePage() {
	return (
		<AppShell pathname="/dashboard/attendance">
			<AttendanceView />
		</AppShell>
	);
}

