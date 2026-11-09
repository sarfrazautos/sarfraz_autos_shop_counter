"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
	History,
	Search,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	Hourglass,
	CalendarOff,
	AlertCircle,
	FileTextIcon,
	MapPin,
	Filter,
	Download,
	CalendarDays,
} from "lucide-react";

import {
	INITIAL_ATTENDANCE_HISTORY,
	type AttendanceHistoryEntry,
} from "./history-types";
import type { AttendanceStatus, BranchId } from "./types";

export function AttendanceHistoryView() {
	const [historyRecords] = useState<AttendanceHistoryEntry[]>(INITIAL_ATTENDANCE_HISTORY);
	const [selectedBranch, setSelectedBranch] = useState<BranchId>("all");
	const [selectedDate, setSelectedDate] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [activeDetailRecord, setActiveDetailRecord] = useState<AttendanceHistoryEntry | null>(null);

	const branchTabs: { id: BranchId; label: string }[] = [
		{ id: "all", label: "All Branches" },
		{ id: "main", label: "1st Branch (Saddar)" },
		{ id: "branch-2", label: "2nd Branch (Gulshan)" },
		{ id: "branch-3", label: "3rd Branch (DHA)" },
	];

	const dateFilters = [
		{ id: "all", label: "All Days" },
		{ id: "2026-11-08", label: "08 Nov (Yesterday)" },
		{ id: "2026-11-07", label: "07 Nov (Saturday)" },
		{ id: "2026-11-06", label: "06 Nov (Friday)" },
	];

	const statusFilters = [
		{ id: "all", label: "All Statuses" },
		{ id: "present", label: "Present" },
		{ id: "late", label: "Late" },
		{ id: "half-day", label: "Half Day" },
		{ id: "on-leave", label: "On Leave" },
		{ id: "absent", label: "Absent" },
	];

	const getStatusBadge = (status: AttendanceStatus) => {
		switch (status) {
			case "present":
				return (
					<Badge
						className="border-0 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium"
						variant="outline"
					>
						<CheckCircle2 className="size-3 mr-1" />
						Present
					</Badge>
				);
			case "late":
				return (
					<Badge
						className="border-0 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 font-medium"
						variant="outline"
					>
						<Clock className="size-3 mr-1" />
						Late
					</Badge>
				);
			case "half-day":
				return (
					<Badge
						className="border-0 bg-sky-500/15 text-sky-700 hover:bg-sky-500/25 dark:bg-sky-500/10 dark:text-sky-400 font-medium"
						variant="outline"
					>
						<Hourglass className="size-3 mr-1" />
						Half Day
					</Badge>
				);
			case "on-leave":
				return (
					<Badge
						className="border-0 bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 dark:bg-purple-500/10 dark:text-purple-400 font-medium"
						variant="outline"
					>
						<CalendarOff className="size-3 mr-1" />
						Leave
					</Badge>
				);
			case "absent":
				return (
					<Badge
						className="border-0 bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 font-medium"
						variant="outline"
					>
						<AlertCircle className="size-3 mr-1" />
						Absent
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	const filteredRecords = useMemo(() => {
		return historyRecords.filter((r) => {
			const matchesBranch = selectedBranch === "all" || r.branchId === selectedBranch;
			const matchesDate = selectedDate === "all" || r.date === selectedDate;
			const matchesStatus = selectedStatus === "all" || r.status === selectedStatus;

			const q = searchQuery.trim().toLowerCase();
			if (!q) return matchesBranch && matchesDate && matchesStatus;

			const matchesQuery =
				r.employeeName.toLowerCase().includes(q) ||
				r.employeeRole.toLowerCase().includes(q) ||
				r.branchName.toLowerCase().includes(q) ||
				r.formattedDate.toLowerCase().includes(q) ||
				r.notes.toLowerCase().includes(q);

			return matchesBranch && matchesDate && matchesStatus && matchesQuery;
		});
	}, [historyRecords, selectedBranch, selectedDate, selectedStatus, searchQuery]);

	// History metrics
	const totalLogged = filteredRecords.length;
	const presentLogged = filteredRecords.filter((r) => r.status === "present").length;
	const lateLogged = filteredRecords.filter((r) => r.status === "late").length;
	const absentLogged = filteredRecords.filter((r) => r.status === "absent" || r.status === "on-leave").length;

	return (
		<div className="flex flex-col gap-6 w-full max-w-full min-w-0">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
							Attendance Logs & History Archive
						</h1>
						<Badge variant="outline" className="text-xs font-normal">
							Historical Record
						</Badge>
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
						<History className="size-3.5" />
						<span>Audit previous days of employee attendance across all 3 branches</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" className="gap-2 cursor-pointer">
						<Download className="size-3.5" />
						Export CSV
					</Button>
				</div>
			</div>

			{/* Metric summary */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<Card className="rounded-xl border bg-card p-4 shadow-2xs">
					<CardContent className="p-0">
						<p className="text-xs font-medium text-muted-foreground">Historical Shifts Evaluated</p>
						<p className="font-heading text-2xl font-bold tracking-tight text-foreground mt-1">
							{totalLogged}
						</p>
					</CardContent>
				</Card>
				<Card className="rounded-xl border bg-card p-4 shadow-2xs">
					<CardContent className="p-0">
						<p className="text-xs font-medium text-muted-foreground">Punctual / Present</p>
						<p className="font-heading text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
							{presentLogged}
						</p>
					</CardContent>
				</Card>
				<Card className="rounded-xl border bg-card p-4 shadow-2xs">
					<CardContent className="p-0">
						<p className="text-xs font-medium text-muted-foreground">Late Punctuality Rate</p>
						<p className="font-heading text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-1">
							{lateLogged}
						</p>
					</CardContent>
				</Card>
				<Card className="rounded-xl border bg-card p-4 shadow-2xs">
					<CardContent className="p-0">
						<p className="text-xs font-medium text-muted-foreground">Recorded Absences & Leaves</p>
						<p className="font-heading text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 mt-1">
							{absentLogged}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Controls & Filter Bar */}
			<div className="flex flex-col gap-3 pt-1">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
					{/* Search */}
					<div className="relative flex-1 max-w-md">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
						<Input
							placeholder="Search by staff name, date (e.g. 08 Nov), role, remarks..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 h-9 text-sm"
						/>
					</div>

					{/* Date Range Selector Pills */}
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-xs text-muted-foreground mr-1 hidden sm:inline-flex items-center gap-1">
							<CalendarDays className="size-3" /> Date:
						</span>
						{dateFilters.map((tab) => {
							const active = selectedDate === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => setSelectedDate(tab.id)}
									className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer ${
										active
											? "bg-foreground text-background shadow-2xs"
											: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
									}`}
								>
									{tab.label}
								</button>
							);
						})}
					</div>
				</div>

				{/* Branch Filter Tabs */}
				<div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-xs text-muted-foreground mr-1 inline-flex items-center gap-1">
							<Building2 className="size-3" /> Branch:
						</span>
						{branchTabs.map((tab) => {
							const active = selectedBranch === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => setSelectedBranch(tab.id)}
									className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer ${
										active
											? "bg-primary text-primary-foreground shadow-2xs"
											: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
									}`}
								>
									{tab.label}
								</button>
							);
						})}
					</div>

					{/* Status Filter */}
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-xs text-muted-foreground mr-1 inline-flex items-center gap-1">
							<Filter className="size-3" /> Status:
						</span>
						{statusFilters.map((st) => {
							const active = selectedStatus === st.id;
							return (
								<button
									key={st.id}
									type="button"
									onClick={() => setSelectedStatus(st.id)}
									className={`rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
										active
											? "bg-foreground/15 text-foreground font-semibold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{st.label}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* History Data Table */}
			<div className="w-full min-w-0 max-w-full rounded-xl border bg-card shadow-2xs overflow-hidden">
				<Table className="min-w-[760px]">
					<TableHeader>
						<TableRow className="border-b bg-muted/40 hover:bg-muted/40">
							<TableHead className="h-12 px-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider w-[120px]">
								Date & Day
							</TableHead>
							<TableHead className="h-12 px-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider min-w-[180px]">
								Staff Member
							</TableHead>
							<TableHead className="h-12 px-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider min-w-[140px]">
								Branch
							</TableHead>
							<TableHead className="h-12 px-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider w-[100px]">
								Status
							</TableHead>
							<TableHead className="h-12 px-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider w-[120px]">
								Punched In / Out
							</TableHead>
							<TableHead className="h-12 px-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider w-[90px]">
								Shift
							</TableHead>
							<TableHead className="h-12 px-3 text-left font-semibold text-foreground text-xs uppercase tracking-wider">
								Notes & Audit Remarks
							</TableHead>
							<TableHead className="h-12 px-3 text-center font-semibold text-foreground text-xs uppercase tracking-wider w-[70px]">
								Details
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredRecords.length > 0 ? (
							filteredRecords.map((record) => {
								const initials = record.employeeName
									.split(" ")
									.map((p) => p[0])
									.slice(0, 2)
									.join("")
									.toUpperCase();

								return (
									<TableRow className="hover:bg-muted/50 transition-colors" key={record.id}>
										{/* Date */}
										<TableCell className="h-16 px-3">
											<div className="flex flex-col">
												<span className="font-semibold text-xs text-foreground font-mono">
													{record.formattedDate}
												</span>
												<span className="text-[11px] text-muted-foreground">
													{record.dayOfWeek}
												</span>
											</div>
										</TableCell>

										{/* Staff Member */}
										<TableCell className="h-16 px-3">
											<div className="flex items-center gap-2.5 min-w-0">
												<Avatar className="size-8 border shadow-2xs shrink-0">
													<AvatarImage src={record.avatarUrl} alt={record.employeeName} />
													<AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
												</Avatar>
												<div className="min-w-0">
													<p className="font-medium text-xs sm:text-sm text-foreground truncate">{record.employeeName}</p>
													<p className="text-[11px] text-muted-foreground truncate">{record.employeeRole}</p>
												</div>
											</div>
										</TableCell>

										{/* Branch */}
										<TableCell className="h-16 px-3 text-xs font-medium text-muted-foreground">
											<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/70 text-foreground border border-border/50 text-xs">
												<MapPin className="size-3 text-muted-foreground shrink-0" />
												<span className="truncate">{record.branchName}</span>
											</div>
										</TableCell>

										{/* Status */}
										<TableCell className="h-16 px-3">
											{getStatusBadge(record.status)}
										</TableCell>

										{/* Times */}
										<TableCell className="h-16 px-3 text-xs">
											<div className="flex flex-col gap-0.5 font-mono text-[11px]">
												<span className="text-foreground">In: {record.checkInTime}</span>
												<span className="text-muted-foreground">Out: {record.checkOutTime}</span>
											</div>
										</TableCell>

										{/* Shift Hours */}
										<TableCell className="h-16 px-3 text-xs font-medium text-foreground font-mono">
											{record.shiftHours}
										</TableCell>

										{/* Notes */}
										<TableCell className="h-16 max-w-[200px] px-3 text-muted-foreground text-xs">
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger render={<span className="block cursor-help truncate hover:text-foreground transition-colors" />}>
														{record.notes}
													</TooltipTrigger>
													<TooltipContent className="max-w-xs text-xs">
														{record.notes}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</TableCell>

										{/* View Action */}
										<TableCell className="h-16 px-3 text-center">
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger
														render={
															<Button
																aria-label="View Audit Record"
																className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
																onClick={() => setActiveDetailRecord(record)}
																size="icon"
																variant="outline"
															/>
														}
													>
														<FileTextIcon className="size-3.5" />
													</TooltipTrigger>
													<TooltipContent className="text-xs">View Log Details</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</TableCell>
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-sm">
									No historical records match the selected date or filters.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Details Modal */}
			<Dialog open={!!activeDetailRecord} onOpenChange={(open) => !open && setActiveDetailRecord(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-semibold">Attendance Archive Log</DialogTitle>
						<DialogDescription className="text-xs text-muted-foreground">
							Historical record audit details for Sarfraz Autos.
						</DialogDescription>
					</DialogHeader>

					{activeDetailRecord && (
						<div className="space-y-4 py-2 text-sm">
							<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/60">
								<Avatar className="size-11 border">
									<AvatarImage src={activeDetailRecord.avatarUrl} alt={activeDetailRecord.employeeName} />
									<AvatarFallback>{activeDetailRecord.employeeName.slice(0, 2).toUpperCase()}</AvatarFallback>
								</Avatar>
								<div>
									<h4 className="font-semibold text-foreground">{activeDetailRecord.employeeName}</h4>
									<p className="text-xs text-muted-foreground">{activeDetailRecord.employeeRole}</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3 text-xs">
								<div className="p-2.5 rounded-md border bg-card">
									<p className="text-muted-foreground font-medium">Log Date</p>
									<p className="font-semibold text-foreground mt-0.5">{activeDetailRecord.formattedDate} ({activeDetailRecord.dayOfWeek})</p>
								</div>
								<div className="p-2.5 rounded-md border bg-card">
									<p className="text-muted-foreground font-medium">Branch Location</p>
									<p className="font-semibold text-foreground mt-0.5">{activeDetailRecord.branchName}</p>
								</div>
								<div className="p-2.5 rounded-md border bg-card">
									<p className="text-muted-foreground font-medium">Status Logged</p>
									<div className="mt-0.5">{getStatusBadge(activeDetailRecord.status)}</div>
								</div>
								<div className="p-2.5 rounded-md border bg-card">
									<p className="text-muted-foreground font-medium">Total Shift Duration</p>
									<p className="font-semibold text-foreground mt-0.5 font-mono">{activeDetailRecord.shiftHours}</p>
								</div>
								<div className="p-2.5 rounded-md border bg-card">
									<p className="text-muted-foreground font-medium">Punched In</p>
									<p className="font-semibold text-foreground mt-0.5 font-mono">{activeDetailRecord.checkInTime}</p>
								</div>
								<div className="p-2.5 rounded-md border bg-card">
									<p className="text-muted-foreground font-medium">Punched Out</p>
									<p className="font-semibold text-foreground mt-0.5 font-mono">{activeDetailRecord.checkOutTime}</p>
								</div>
							</div>

							<div className="p-3 rounded-md border bg-card text-xs">
								<p className="text-muted-foreground font-medium mb-1">Supervisor Notes & Exceptions</p>
								<p className="text-foreground leading-relaxed">{activeDetailRecord.notes}</p>
							</div>
						</div>
					)}

					<DialogFooter>
						<DialogClose render={<Button size="sm" variant="outline" className="cursor-pointer">Close</Button>} />
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

