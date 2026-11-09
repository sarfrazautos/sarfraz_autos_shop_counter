"use client";

import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	CalendarCheck,
	Search,
	SlidersHorizontal,
	Calendar as CalendarIcon,
	CheckCheck,
	Building2,
	RefreshCw,
} from "lucide-react";

import {
	INITIAL_ATTENDANCE_RECORDS,
	type AttendanceRecord,
	type AttendanceStatus,
	type BranchId,
} from "./types";
import { AttendanceStats } from "./attendance-stats";
import { AttendanceTable } from "./attendance-table";

export function AttendanceView() {
	const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_RECORDS);
	const [selectedBranch, setSelectedBranch] = useState<BranchId>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [isMarkingAll, setIsMarkingAll] = useState(false);
	const [todayDateString, setTodayDateString] = useState("Today's Roster");

	useEffect(() => {
		setTodayDateString(
			new Date().toLocaleDateString("en-GB", {
				weekday: "short",
				day: "2-digit",
				month: "short",
				year: "numeric",
			})
		);
	}, []);

	const branchTabs: { id: BranchId; label: string }[] = [
		{ id: "all", label: "All Branches" },
		{ id: "main", label: "1st Branch (Saddar)" },
		{ id: "branch-2", label: "2nd Branch (Gulshan)" },
		{ id: "branch-3", label: "3rd Branch (DHA)" },
	];

	const handleStatusChange = (
		recordId: string,
		status: AttendanceStatus,
		checkInTime?: string,
		checkOutTime?: string
	) => {
		setRecords((prev) =>
			prev.map((r) => {
				if (r.id !== recordId) return r;
				return {
					...r,
					status,
					checkInTime: checkInTime !== undefined ? checkInTime : r.checkInTime,
					checkOutTime: checkOutTime !== undefined ? checkOutTime : r.checkOutTime,
				};
			})
		);
	};

	const handleDeleteRecord = (recordId: string) => {
		setRecords((prev) => prev.filter((r) => r.id !== recordId));
	};

	const handleMarkAllPresent = () => {
		setIsMarkingAll(true);
		setTimeout(() => {
			const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
			setRecords((prev) =>
				prev.map((r) => ({
					...r,
					status: "present",
					checkInTime: r.checkInTime === "--" ? now : r.checkInTime,
				}))
			);
			setIsMarkingAll(false);
		}, 600);
	};

	const filteredRecords = useMemo(() => {
		return records.filter((r) => {
			const matchesBranch = selectedBranch === "all" || r.branchId === selectedBranch;
			const matchesStatus = selectedStatus === "all" || r.status === selectedStatus;

			const query = searchQuery.trim().toLowerCase();
			if (!query) return matchesBranch && matchesStatus;

			const matchesQuery =
				r.employeeName.toLowerCase().includes(query) ||
				r.employeeRole.toLowerCase().includes(query) ||
				r.branchName.toLowerCase().includes(query) ||
				r.notes.toLowerCase().includes(query);

			return matchesBranch && matchesStatus && matchesQuery;
		});
	}, [records, selectedBranch, selectedStatus, searchQuery]);

	return (
		<div className="flex flex-col gap-6">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
							Daily Attendance & Shift Roster
						</h1>
						<Badge variant="outline" className="text-xs font-normal">
							Live Tracker
						</Badge>
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
						<CalendarIcon className="size-3.5" />
						<span>Today: {todayDateString}</span>
						<span>•</span>
						<span>3 Auto Branches Operating</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleMarkAllPresent}
						disabled={isMarkingAll}
						className="gap-2 cursor-pointer"
					>
						{isMarkingAll ? (
							<RefreshCw className="size-3.5 animate-spin" />
						) : (
							<CheckCheck className="size-3.5 text-emerald-600" />
						)}
						Mark All Present
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<AttendanceStats records={records} />

			{/* Filter Bar */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
				{/* Search Bar */}
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
					<Input
						placeholder="Search by staff name, role, branch or remarks..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 h-9 text-sm"
					/>
				</div>

				{/* Branch Filter Pills */}
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="text-xs text-muted-foreground mr-1 hidden sm:inline-flex items-center gap-1">
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
			</div>

			{/* Attendance Table */}
			<AttendanceTable
				records={filteredRecords}
				onStatusChange={handleStatusChange}
				onDeleteRecord={handleDeleteRecord}
			/>
		</div>
	);
}
