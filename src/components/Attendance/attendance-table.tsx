"use client";

import { useState } from "react";
import {
	CheckCircle,
	FileTextIcon,
	Loader2,
	PauseIcon,
	PlayIcon,
	Trash2Icon,
	Clock,
	AlertCircle,
	CheckCircle2,
	MapPin,
	CalendarOff,
	Hourglass,
	Check,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import type { AttendanceRecord, AttendanceStatus } from "./types";

interface AttendanceTableProps {
	records: AttendanceRecord[];
	onStatusChange: (recordId: string, status: AttendanceStatus, checkInTime?: string, checkOutTime?: string) => void;
	onDeleteRecord: (recordId: string) => void;
}

export function AttendanceTable({
	records,
	onStatusChange,
	onDeleteRecord,
}: AttendanceTableProps) {
	const [pendingAction, setPendingAction] = useState<{
		id: string;
		status: AttendanceStatus;
	} | null>(null);

	const [activeDetailRecord, setActiveDetailRecord] = useState<AttendanceRecord | null>(null);
	const [confirmModal, setConfirmModal] = useState<{
		record: AttendanceRecord;
		status: AttendanceStatus;
		title: string;
		description: string;
	} | null>(null);

	const isActionPending = (status: AttendanceStatus, recordId: string) =>
		pendingAction?.id === recordId && pendingAction.status === status;

	const isRecordBusy = (recordId: string) => pendingAction?.id === recordId;

	const getCurrentTimeString = () => {
		const now = new Date();
		return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	const applyStatusChange = (record: AttendanceRecord, newStatus: AttendanceStatus) => {
		setPendingAction({ id: record.id, status: newStatus });

		setTimeout(() => {
			const nowTime = getCurrentTimeString();
			let newIn = record.checkInTime;
			let newOut = record.checkOutTime;

			if (newStatus === "present") {
				if (newIn === "--") newIn = nowTime;
			} else if (newStatus === "late") {
				if (newIn === "--") newIn = nowTime;
			} else if (newStatus === "half-day") {
				if (newIn === "--") newIn = nowTime;
				if (newOut === "--") newOut = "01:30 PM";
			} else if (newStatus === "absent" || newStatus === "on-leave") {
				newIn = "--";
				newOut = "--";
			}

			onStatusChange(record.id, newStatus, newIn, newOut);
			setPendingAction(null);
		}, 450);
	};

	const handleStatusClick = (record: AttendanceRecord, targetStatus: AttendanceStatus) => {
		if (targetStatus === "absent") {
			setConfirmModal({
				record,
				status: "absent",
				title: "Mark Staff as Absent?",
				description: `This will reset today's check-in/out timestamps and flag ${record.employeeName} as Absent.`,
			});
			return;
		}

		if (targetStatus === "on-leave") {
			setConfirmModal({
				record,
				status: "on-leave",
				title: "Mark Staff on Approved Leave?",
				description: `Record approved leave for ${record.employeeName} today.`,
			});
			return;
		}

		applyStatusChange(record, targetStatus);
	};

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

	const renderRow = (record: AttendanceRecord) => {
		const busy = isRecordBusy(record.id);

		const initials = record.employeeName
			.split(" ")
			.map((p) => p[0])
			.slice(0, 2)
			.join("")
			.toUpperCase();

		return (
			<TableRow className="hover:bg-muted/50 transition-colors" key={record.id}>
				{/* Employee info */}
				<TableCell className="h-16 px-4">
					<div className="flex items-center gap-3">
						<Avatar className="size-9 border shadow-2xs">
							<AvatarImage src={record.avatarUrl} alt={record.employeeName} />
							<AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<p className="font-medium text-sm text-foreground truncate">{record.employeeName}</p>
							<p className="text-xs text-muted-foreground truncate">{record.employeeRole}</p>
						</div>
					</div>
				</TableCell>

				{/* Branch */}
				<TableCell className="h-16 px-4 text-xs font-medium text-muted-foreground">
					<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/70 text-foreground border border-border/50">
						<MapPin className="size-3 text-muted-foreground shrink-0" />
						<span className="truncate">{record.branchName}</span>
					</div>
				</TableCell>

				{/* Status Badge */}
				<TableCell className="h-16 px-4">
					{getStatusBadge(record.status)}
				</TableCell>

				{/* Check In / Out Time */}
				<TableCell className="h-16 px-4 text-xs">
					<div className="flex flex-col gap-0.5">
						<span className="text-foreground font-mono font-medium">In: {record.checkInTime}</span>
						<span className="text-muted-foreground font-mono">Out: {record.checkOutTime}</span>
					</div>
				</TableCell>

				{/* Notes tooltip */}
				<TableCell className="h-16 max-w-[220px] px-4 text-muted-foreground text-xs">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger render={<span className="block cursor-help truncate hover:text-foreground transition-colors" />}>
								{record.notes || "No remarks"}
							</TooltipTrigger>
							<TooltipContent className="max-w-xs text-xs">
								{record.notes || "No daily remarks recorded."}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</TableCell>

				{/* Actions with status hover tooltips: Present, Late, Half Day, Leave, Absent, Details */}
				<TableCell className="h-16 px-4">
					<TooltipProvider>
						<div className="flex items-center gap-1">
							{/* 1. Present */}
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-label="Present"
											className={`h-8 w-8 cursor-pointer transition-colors ${
												record.status === "present"
													? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40"
													: "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10"
											}`}
											disabled={busy}
											onClick={() => handleStatusClick(record, "present")}
											size="icon"
											variant="outline"
										/>
									}
								>
									{isActionPending("present", record.id) ? (
										<Loader2 className="size-3.5 animate-spin text-emerald-600" />
									) : (
										<CheckCircle2 className="size-3.5 text-emerald-600" />
									)}
								</TooltipTrigger>
								<TooltipContent className="text-xs font-medium">Present</TooltipContent>
							</Tooltip>

							{/* 2. Late */}
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-label="Late"
											className={`h-8 w-8 cursor-pointer transition-colors ${
												record.status === "late"
													? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40"
													: "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
											}`}
											disabled={busy}
											onClick={() => handleStatusClick(record, "late")}
											size="icon"
											variant="outline"
										/>
									}
								>
									{isActionPending("late", record.id) ? (
										<Loader2 className="size-3.5 animate-spin text-amber-600" />
									) : (
										<Clock className="size-3.5 text-amber-600" />
									)}
								</TooltipTrigger>
								<TooltipContent className="text-xs font-medium">Late</TooltipContent>
							</Tooltip>

							{/* 3. Half Day */}
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-label="Half Day"
											className={`h-8 w-8 cursor-pointer transition-colors ${
												record.status === "half-day"
													? "bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/40"
													: "text-muted-foreground hover:text-sky-600 hover:bg-sky-500/10"
											}`}
											disabled={busy}
											onClick={() => handleStatusClick(record, "half-day")}
											size="icon"
											variant="outline"
										/>
									}
								>
									{isActionPending("half-day", record.id) ? (
										<Loader2 className="size-3.5 animate-spin text-sky-600" />
									) : (
										<Hourglass className="size-3.5 text-sky-600" />
									)}
								</TooltipTrigger>
								<TooltipContent className="text-xs font-medium">Half Day</TooltipContent>
							</Tooltip>

							{/* 4. On Leave */}
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-label="On Leave"
											className={`h-8 w-8 cursor-pointer transition-colors ${
												record.status === "on-leave"
													? "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/40"
													: "text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10"
											}`}
											disabled={busy}
											onClick={() => handleStatusClick(record, "on-leave")}
											size="icon"
											variant="outline"
										/>
									}
								>
									{isActionPending("on-leave", record.id) ? (
										<Loader2 className="size-3.5 animate-spin text-purple-600" />
									) : (
										<CalendarOff className="size-3.5 text-purple-600" />
									)}
								</TooltipTrigger>
								<TooltipContent className="text-xs font-medium">On Leave</TooltipContent>
							</Tooltip>

							{/* 5. Absent */}
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-label="Absent"
											className={`h-8 w-8 cursor-pointer transition-colors ${
												record.status === "absent"
													? "bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40"
													: "text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
											}`}
											disabled={busy}
											onClick={() => handleStatusClick(record, "absent")}
											size="icon"
											variant="outline"
										/>
									}
								>
									{isActionPending("absent", record.id) ? (
										<Loader2 className="size-3.5 animate-spin text-rose-600" />
									) : (
										<Trash2Icon className="size-3.5 text-rose-600" />
									)}
								</TooltipTrigger>
								<TooltipContent className="text-xs font-medium">Absent</TooltipContent>
							</Tooltip>

							{/* 6. View Details */}
							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											aria-label="View Details"
											className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
											disabled={busy}
											onClick={() => setActiveDetailRecord(record)}
											size="icon"
											variant="outline"
										/>
									}
								>
									<FileTextIcon className="size-3.5" />
								</TooltipTrigger>
								<TooltipContent className="text-xs font-medium">View Details</TooltipContent>
							</Tooltip>
						</div>
					</TooltipProvider>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<>
			<div className="w-full rounded-xl border bg-card shadow-2xs overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow className="border-b bg-muted/40 hover:bg-muted/40">
							<TableHead className="h-12 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">
								Staff Member
							</TableHead>
							<TableHead className="h-12 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">
								Branch
							</TableHead>
							<TableHead className="h-12 w-[120px] px-4 font-semibold text-foreground text-xs uppercase tracking-wider">
								Status
							</TableHead>
							<TableHead className="h-12 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">
								Punch Time
							</TableHead>
							<TableHead className="h-12 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">
								Daily Remarks
							</TableHead>
							<TableHead className="h-12 w-[220px] px-4 font-semibold text-foreground text-xs uppercase tracking-wider">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{records.length > 0 ? (
							records.map(renderRow)
						) : (
							<TableRow>
								<TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
									No attendance logs match the current filter.
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
						<DialogTitle className="text-base font-semibold">Attendance Record Details</DialogTitle>
						<DialogDescription className="text-xs text-muted-foreground">
							Daily log overview for Sarfraz Autos staff roster.
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
									<p className="text-muted-foreground font-medium">Branch</p>
									<p className="font-semibold text-foreground mt-0.5">{activeDetailRecord.branchName}</p>
								</div>
								<div className="p-2.5 rounded-md border bg-card">
									<p className="text-muted-foreground font-medium">Status</p>
									<div className="mt-0.5">{getStatusBadge(activeDetailRecord.status)}</div>
								</div>
								<div className="p-2.5 rounded-md border bg-card">
									<p className="text-muted-foreground font-medium">Check-In</p>
									<p className="font-semibold text-foreground mt-0.5">{activeDetailRecord.checkInTime}</p>
								</div>
								<div className="p-2.5 rounded-md border bg-card">
									<p className="text-muted-foreground font-medium">Check-Out</p>
									<p className="font-semibold text-foreground mt-0.5">{activeDetailRecord.checkOutTime}</p>
								</div>
							</div>

							<div className="p-3 rounded-md border bg-card text-xs">
								<p className="text-muted-foreground font-medium mb-1">Supervisor Remarks / Notes</p>
								<p className="text-foreground leading-relaxed">{activeDetailRecord.notes || "None"}</p>
							</div>
						</div>
					)}

					<DialogFooter>
						<DialogClose render={<Button size="sm" variant="outline" className="cursor-pointer">Close</Button>} />
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirm Status Dialog */}
			<Dialog open={!!confirmModal} onOpenChange={(open) => !open && setConfirmModal(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-semibold">{confirmModal?.title}</DialogTitle>
						<DialogDescription className="text-xs text-muted-foreground">
							{confirmModal?.description}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0">
						<DialogClose render={<Button size="sm" variant="outline" className="cursor-pointer">Cancel</Button>} />
						<Button
							size="sm"
							variant={confirmModal?.status === "absent" ? "destructive" : "default"}
							className="cursor-pointer"
							onClick={() => {
								if (confirmModal) {
									applyStatusChange(confirmModal.record, confirmModal.status);
									setConfirmModal(null);
								}
							}}
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
