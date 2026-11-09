import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle2, Clock, UserX, Building2 } from "lucide-react";
import type { AttendanceRecord } from "./types";

interface AttendanceStatsProps {
	records: AttendanceRecord[];
}

export function AttendanceStats({ records }: AttendanceStatsProps) {
	const total = records.length;
	const present = records.filter((r) => r.status === "present").length;
	const late = records.filter((r) => r.status === "late").length;
	const halfDay = records.filter((r) => r.status === "half-day").length;
	const absent = records.filter((r) => r.status === "absent" || r.status === "on-leave").length;

	const attendanceRate = total > 0 ? Math.round(((present + late + halfDay) / total) * 100) : 0;

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			{/* Total Scheduled */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-muted-foreground">Total Staff Scheduled</p>
						<div className="flex items-baseline gap-2 mt-1">
							<span className="font-heading text-2xl font-bold tracking-tight text-foreground">
								{total}
							</span>
							<span className="text-[11px] text-muted-foreground font-medium">3 Branches</span>
						</div>
					</div>
					<div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground/80 shrink-0">
						<Users className="size-5" />
					</div>
				</CardContent>
			</Card>

			{/* Present */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-muted-foreground">On Duty / Present</p>
						<div className="flex items-baseline gap-2 mt-1">
							<span className="font-heading text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
								{present}
							</span>
							<span className="text-[11px] text-emerald-600/80 font-medium">{attendanceRate}% turn out</span>
						</div>
					</div>
					<div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
						<CheckCircle2 className="size-5" />
					</div>
				</CardContent>
			</Card>

			{/* Late / Half Day */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-muted-foreground">Late / Half Day</p>
						<div className="flex items-baseline gap-2 mt-1">
							<span className="font-heading text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
								{late + halfDay}
							</span>
							<span className="text-[11px] text-amber-600/80 font-medium">
								{late} late • {halfDay} half
							</span>
						</div>
					</div>
					<div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
						<Clock className="size-5" />
					</div>
				</CardContent>
			</Card>

			{/* Absent */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-muted-foreground">Absent / On Leave</p>
						<div className="flex items-baseline gap-2 mt-1">
							<span className="font-heading text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
								{absent}
							</span>
							<span className="text-[11px] text-rose-600/80 font-medium">Recorded</span>
						</div>
					</div>
					<div className="flex size-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 shrink-0">
						<UserX className="size-5" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

