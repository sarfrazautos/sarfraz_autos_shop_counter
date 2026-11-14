"use client";

import { useState, useMemo } from "react";
import {
	Clock,
	Search,
	Printer,
	Download,
	MessageCircle,
	AlertTriangle,
	ShieldAlert,
	Building,
	UserCheck,
	MapPin,
	Calendar,
	CheckCircle,
	ArrowUpRight,
	ExternalLink,
	Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	INITIAL_AGING_DATA,
	AGING_ROUTES,
	AGING_SALESMEN,
	type CustomerAgingRow,
} from "./types";
import Link from "next/link";

export function AgingReportView() {
	const [agingData, setAgingData] = useState<CustomerAgingRow[]>(INITIAL_AGING_DATA);
	const [selectedRoute, setSelectedRoute] = useState("All Routes");
	const [selectedSalesman, setSelectedSalesman] = useState("All Collectors");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterMinDays, setFilterMinDays] = useState<"All" | "30+" | "60+" | "90+">("All");

	// Filtered Rows
	const filteredRows = useMemo(() => {
		return agingData.filter((row) => {
			const matchesRoute =
				selectedRoute === "All Routes" || row.route === selectedRoute;
			const matchesSalesman =
				selectedSalesman === "All Collectors" || row.salesman === selectedSalesman;
			const matchesSearch =
				!searchQuery.trim() ||
				row.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				row.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
				row.route.toLowerCase().includes(searchQuery.toLowerCase());

			let matchesDays = true;
			if (filterMinDays === "30+") {
				matchesDays = row.bucket31To60 > 0 || row.bucket61To90 > 0 || row.bucketAbove90 > 0;
			} else if (filterMinDays === "60+") {
				matchesDays = row.bucket61To90 > 0 || row.bucketAbove90 > 0;
			} else if (filterMinDays === "90+") {
				matchesDays = row.bucketAbove90 > 0;
			}

			return matchesRoute && matchesSalesman && matchesSearch && matchesDays;
		});
	}, [agingData, selectedRoute, selectedSalesman, searchQuery, filterMinDays]);

	// KPI Metrics Totals
	const totalReceivables = useMemo(() => {
		return filteredRows.reduce((sum, r) => sum + r.totalBalance, 0);
	}, [filteredRows]);

	const total0To30 = useMemo(() => {
		return filteredRows.reduce((sum, r) => sum + r.bucket0To30, 0);
	}, [filteredRows]);

	const total31To60 = useMemo(() => {
		return filteredRows.reduce((sum, r) => sum + r.bucket31To60, 0);
	}, [filteredRows]);

	const total61To90 = useMemo(() => {
		return filteredRows.reduce((sum, r) => sum + r.bucket61To90, 0);
	}, [filteredRows]);

	const totalAbove90 = useMemo(() => {
		return filteredRows.reduce((sum, r) => sum + r.bucketAbove90, 0);
	}, [filteredRows]);

	// WhatsApp Overdue Payment Reminder
	const handleSendOverdueWhatsApp = (row: CustomerAgingRow) => {
		let rawPhone = (row.phone || "").replace(/[^0-9]/g, "");
		if (rawPhone.startsWith("0")) rawPhone = "92" + rawPhone.slice(1);

		const overdueTotal = row.bucket31To60 + row.bucket61To90 + row.bucketAbove90;
		const msg =
			`*SARFRAZ AUTOS (SHAHMIR) — PAYMENT RECOVERY REMINDER*\n` +
			`━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
			`*Dear:* ${row.customerName} (${row.city})\n` +
			`*Route:* ${row.route} | *Collector:* ${row.salesman}\n\n` +
			`This is a friendly reminder that you have overdue bills awaiting clearance:\n` +
			`• *Current (0-30 days):* Rs. ${row.bucket0To30.toLocaleString()}\n` +
			`• *Due (31-60 days):* Rs. ${row.bucket31To60.toLocaleString()}\n` +
			(row.bucket61To90 > 0 ? `• *High Overdue (61-90 days):* Rs. ${row.bucket61To90.toLocaleString()}\n` : "") +
			(row.bucketAbove90 > 0 ? `• *CRITICAL OVERDUE (90+ days):* Rs. ${row.bucketAbove90.toLocaleString()}\n` : "") +
			`━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
			`*TOTAL RECOVERABLE DUES:* Rs. ${row.totalBalance.toLocaleString()}\n` +
			`━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
			`Kindly arrange payment with our collector ${row.salesman} or transfer online to avoid credit hold.\n` +
			`_Sarfraz Autos Saddar, Karachi — 0333-1285556_`;

		window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`, "_blank");
	};

	return (
		<div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-16">
			{/* TOP HEADER */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<Clock className="size-6" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="font-heading font-black text-lg sm:text-xl text-foreground">
								Aging Report — Customer Receivables
							</h1>
							<Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
								Legacy: All Routes & Age &gt; 0 Days
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5">
							Overdue auto parts recovery analysis grouped by trade route, recovery officer, and aging brackets.
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => window.print()}
						className="h-9 px-3 gap-1.5 text-xs font-semibold cursor-pointer"
					>
						<Printer className="size-3.5" />
						Print Aging Report
					</Button>
				</div>
			</div>

			{/* 4 RECOVERY KPI METRIC CARDS */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Total Market Receivables */}
				<div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
						Total Outstanding Receivables
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl sm:text-3xl font-mono font-black text-foreground">
							Rs. {totalReceivables.toLocaleString()}
						</span>
						<Badge variant="outline" className="text-[10px] font-mono">
							{filteredRows.length} Accounts
						</Badge>
					</div>
					<p className="text-[11px] text-muted-foreground">Total money owed by wholesale dealers</p>
				</div>

				{/* 0 - 30 Days (Current) */}
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
						0 – 30 Days (Current Bills)
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
							Rs. {total0To30.toLocaleString()}
						</span>
						<Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">
							Normal Cycle
						</Badge>
					</div>
					<p className="text-[11px] text-muted-foreground">Active running trade credit within term</p>
				</div>

				{/* 31 - 60 Days (Due for Follow-up) */}
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
						31 – 60 Days (Due for Follow-up)
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">
							Rs. {total31To60.toLocaleString()}
						</span>
						<Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700">
							Action Needed
						</Badge>
					</div>
					<p className="text-[11px] text-muted-foreground">Follow-up required by assigned salesman</p>
				</div>

				{/* 61+ Days (Overdue & Critical) */}
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
						61 – 90+ Days (Critical Overdue)
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">
							Rs. {(total61To90 + totalAbove90).toLocaleString()}
						</span>
						<Badge variant="destructive" className="text-[10px]">
							Credit Hold Risk
						</Badge>
					</div>
					<p className="text-[11px] text-muted-foreground">Overdue debt requiring management recovery</p>
				</div>
			</div>

			{/* FILTER CONTROLS BAR */}
			<div className="rounded-2xl border bg-card p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
					{/* Route Filter */}
					<div className="w-56">
						<Select
							value={selectedRoute}
							onValueChange={(val) => {
								if (val) setSelectedRoute(val);
							}}
						>
							<SelectTrigger className="h-8 text-xs font-semibold bg-background">
								<SelectValue placeholder="Route..." />
							</SelectTrigger>
							<SelectContent>
								{AGING_ROUTES.map((route) => (
									<SelectItem key={route} value={route} className="text-xs">
										{route}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Salesman Filter */}
					<div className="w-52">
						<Select
							value={selectedSalesman}
							onValueChange={(val) => {
								if (val) setSelectedSalesman(val);
							}}
						>
							<SelectTrigger className="h-8 text-xs font-semibold bg-background">
								<SelectValue placeholder="Salesman / Collector..." />
							</SelectTrigger>
							<SelectContent>
								{AGING_SALESMEN.map((s) => (
									<SelectItem key={s} value={s} className="text-xs">
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Days bracket quick filter */}
					<div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border">
						{(["All", "30+", "60+", "90+"] as const).map((bracket) => (
							<button
								key={bracket}
								type="button"
								onClick={() => setFilterMinDays(bracket)}
								className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
									filterMinDays === bracket
										? "bg-background text-foreground shadow-2xs font-bold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{bracket === "All" ? "All Ages" : `${bracket} Days`}
							</button>
						))}
					</div>
				</div>

				{/* Search customer box */}
				<div className="relative w-full sm:w-64">
					<Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search dealer, city, route..."
						className="h-8 text-xs pl-8 bg-background"
					/>
				</div>
			</div>

			{/* AGING DATA TABLE */}
			<div className="rounded-2xl border bg-card shadow-xs overflow-hidden flex flex-col">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
							<tr>
								<th className="py-2.5 px-3.5 min-w-[180px]">Customer Name & City</th>
								<th className="py-2.5 px-3.5 min-w-[140px]">Route / Sector</th>
								<th className="py-2.5 px-3.5 min-w-[120px]">Collector</th>
								<th className="py-2.5 px-3.5 text-right font-mono font-bold min-w-[110px]">
									Total Balance
								</th>
								<th className="py-2.5 px-3.5 text-right text-emerald-700 dark:text-emerald-400 min-w-[95px]">
									0–30 Days
								</th>
								<th className="py-2.5 px-3.5 text-right text-amber-700 dark:text-amber-400 min-w-[95px]">
									31–60 Days
								</th>
								<th className="py-2.5 px-3.5 text-right text-orange-700 dark:text-orange-400 min-w-[95px]">
									61–90 Days
								</th>
								<th className="py-2.5 px-3.5 text-right text-rose-700 dark:text-rose-400 min-w-[95px]">
									90+ Days
								</th>
								<th className="py-2.5 px-3.5 text-center min-w-[140px]">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{filteredRows.length === 0 ? (
								<tr>
									<td colSpan={9} className="py-12 text-center text-muted-foreground">
										No customer receivables found matching active filters.
									</td>
								</tr>
							) : (
								filteredRows.map((row) => {
									const hasHighOverdue = row.bucket61To90 > 0 || row.bucketAbove90 > 0;

									return (
										<tr
											key={row.id}
											className={`hover:bg-muted/30 transition-colors font-mono ${
												row.bucketAbove90 > 0 ? "bg-rose-500/5" : ""
											}`}
										>
											{/* Customer Name */}
											<td className="py-3 px-3.5 font-sans">
												<div className="font-bold text-foreground">
													{row.customerName}
												</div>
												<div className="text-[11px] text-muted-foreground flex items-center gap-2">
													<span>{row.city}</span>
													<span>•</span>
													<span>{row.phone}</span>
												</div>
											</td>

											{/* Route */}
											<td className="py-3 px-3.5 font-sans text-muted-foreground">
												<span className="font-medium text-foreground block">
													{row.route}
												</span>
												<span className="text-[10px] text-muted-foreground">
													Last Paid: {row.lastPaymentDate}
												</span>
											</td>

											{/* Collector */}
											<td className="py-3 px-3.5 font-sans font-medium text-foreground whitespace-nowrap">
												{row.salesman}
											</td>

											{/* Total Balance */}
											<td className="py-3 px-3.5 text-right font-black text-foreground text-sm">
												Rs. {row.totalBalance.toLocaleString()}
											</td>

											{/* 0-30 Days */}
											<td className="py-3 px-3.5 text-right text-emerald-700 dark:text-emerald-400 font-semibold">
												{row.bucket0To30 > 0 ? `Rs. ${row.bucket0To30.toLocaleString()}` : "—"}
											</td>

											{/* 31-60 Days */}
											<td className="py-3 px-3.5 text-right text-amber-700 dark:text-amber-400 font-semibold">
												{row.bucket31To60 > 0 ? `Rs. ${row.bucket31To60.toLocaleString()}` : "—"}
											</td>

											{/* 61-90 Days */}
											<td className="py-3 px-3.5 text-right text-orange-700 dark:text-orange-400 font-bold">
												{row.bucket61To90 > 0 ? `Rs. ${row.bucket61To90.toLocaleString()}` : "—"}
											</td>

											{/* 90+ Days */}
											<td className="py-3 px-3.5 text-right text-rose-600 dark:text-rose-400 font-black">
												{row.bucketAbove90 > 0 ? `Rs. ${row.bucketAbove90.toLocaleString()}` : "—"}
											</td>

											{/* Actions */}
											<td className="py-3 px-3.5 text-center font-sans">
												<div className="flex items-center justify-center gap-1.5">
													<Button
														size="xs"
														variant="outline"
														onClick={() => handleSendOverdueWhatsApp(row)}
														className="h-7 px-2 gap-1 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-[11px] font-semibold cursor-pointer"
														title="Send overdue statement to customer WhatsApp"
													>
														<MessageCircle className="size-3 text-emerald-600" />
														Remind
													</Button>

													<Button
														size="xs"
														variant="ghost"
														className="h-7 px-2 text-[11px] cursor-pointer text-muted-foreground hover:text-foreground"
														render={<Link href={`/dashboard/ledger?customer=${encodeURIComponent(row.customerName)}`} />}
													>
														Ledger
													</Button>
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Report Summary Footer */}
				<div className="p-4 border-t bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold gap-2">
					<span className="text-muted-foreground font-sans">
						Total Active Accounts: <strong>{filteredRows.length}</strong> on selected routes
					</span>
					<div className="flex items-center gap-5 font-mono">
						<span>0-30d: <strong className="text-emerald-600">Rs. {total0To30.toLocaleString()}</strong></span>
						<span>31-60d: <strong className="text-amber-600">Rs. {total31To60.toLocaleString()}</strong></span>
						<span>61-90d: <strong className="text-orange-600">Rs. {total61To90.toLocaleString()}</strong></span>
						<span>90d+: <strong className="text-rose-600">Rs. {totalAbove90.toLocaleString()}</strong></span>
						<span>Grand Total: <strong className="text-foreground text-sm font-black">Rs. {totalReceivables.toLocaleString()}</strong></span>
					</div>
				</div>
			</div>
		</div>
	);
}
