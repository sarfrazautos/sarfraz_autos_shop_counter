"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
	fetchTopSellingReport,
	type TopSellingProductItem,
	type TopSellingSummary,
	type TopOrderItem,
} from "@/lib/api/reports/reports-api";
import {
	TrendingUp,
	Calendar,
	Filter,
	RotateCw,
	Printer,
	SlidersHorizontal,
	Sparkles,
	Bike,
	Layers,
	ChevronRight,
	Store,
	ShoppingBag,
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
import Link from "next/link";
import { TopSellingKpiCards } from "./top-selling-kpi-cards";
import { TopSellingTable } from "./top-selling-table";
import { TopOrdersCard } from "./top-orders-card";
import { TopSellingSkeleton } from "./top-selling-skeleton";

const TIME_PRESETS = [
	{ id: "today", label: "Today" },
	{ id: "7days", label: "Last 7 Days" },
	{ id: "this_month", label: "This Month" },
	{ id: "last_month", label: "Last Month" },
	{ id: "this_year", label: "This Year" },
	{ id: "last_year", label: "Last Year" },
	{ id: "all_time", label: "All Time" },
	{ id: "custom", label: "Custom Range" },
];

const BIKE_MODELS = [
	"All Models",
	"Honda CD70",
	"Honda CG125",
	"Honda Pridor 100cc",
	"Crown 70cc",
	"Suzuki GS150",
	"Yamaha YBR 125",
	"Universal",
];

const CATEGORIES = [
	"All Categories",
	"Engine",
	"Clutch & Transmission",
	"Electrical",
	"Braking System",
	"Body Parts & Frame",
	"Suspension",
	"Cables & Levers",
	"Carburetors",
];

export function TopSellingView() {
	const [timeRange, setTimeRange] = useState<string>("this_month");
	const [sortBy, setSortBy] = useState<"quantity" | "revenue" | "orders">("quantity");
	const [selectedModel, setSelectedModel] = useState<string>("All Models");
	const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");
	const [limit, setLimit] = useState<number>(50);

	// TanStack query
	const {
		data: reportResponse,
		isLoading,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: queryKeys.reports.topSelling({
			timeRange,
			sortBy,
			bikeModel: selectedModel,
			category: selectedCategory,
			startDate: timeRange === "custom" ? startDate : undefined,
			endDate: timeRange === "custom" ? endDate : undefined,
			limit,
		}),
		queryFn: () =>
			fetchTopSellingReport({
				timeRange,
				sortBy,
				bikeModel: selectedModel !== "All Models" ? selectedModel : undefined,
				category: selectedCategory !== "All Categories" ? selectedCategory : undefined,
				startDate: timeRange === "custom" ? startDate : undefined,
				endDate: timeRange === "custom" ? endDate : undefined,
				limit,
			}),
		staleTime: 1000 * 60 * 3, // 3 minutes stale cache
	});

	const reportData = reportResponse?.data;
	const summary: TopSellingSummary = reportData?.summary || {
		totalUnitsSold: 0,
		totalRevenue: 0,
		distinctProductsCount: 0,
		totalInvoicesCount: 0,
	};
	const highlights = reportData?.highlights || {
		topByVolume: null,
		topByRevenue: null,
		topByFrequency: null,
	};
	const topSellingProducts: TopSellingProductItem[] = reportData?.topSellingProducts || [];
	const topOrders: TopOrderItem[] = reportData?.topOrders || [];
	const categoryBreakdown = reportData?.categoryBreakdown || [];
	const bikeModelBreakdown = reportData?.bikeModelBreakdown || [];

	const currentPresetLabel =
		TIME_PRESETS.find((p) => p.id === timeRange)?.label || "Selected Period";

	const handlePrint = () => {
		if (typeof window !== "undefined") {
			window.print();
		}
	};

	return (
		<div className="space-y-6">
			{/* 1. TOP HEADER & BREADCRUMBS */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
				<div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
						<Link href="/dashboard" className="hover:text-foreground">
							Dashboard
						</Link>
						<ChevronRight className="size-3" />
						<Link href="/dashboard/orders" className="hover:text-foreground">
							Sales
						</Link>
						<ChevronRight className="size-3" />
						<span className="text-foreground font-medium">Top Selling Analytics</span>
					</div>
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
							<TrendingUp className="size-5" />
						</div>
						<div>
							<h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground flex items-center gap-2">
								Most Selling Products & Orders
								<Badge className="bg-primary/15 text-primary border-primary/20 text-xs">
									Sales Insights
								</Badge>
							</h1>
							<p className="text-xs text-muted-foreground mt-0.5">
								Discover which products sell highest in volume, earn peak revenue, and see largest sealed customer invoices.
							</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isFetching}
						className="h-9 text-xs font-semibold gap-1.5 cursor-pointer hover:bg-muted"
					>
						<RotateCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
						Refresh
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={handlePrint}
						className="h-9 text-xs font-semibold gap-1.5 cursor-pointer hover:bg-muted"
					>
						<Printer className="size-3.5" />
						Print Report
					</Button>

					<Link href="/dashboard/counter">
						<Button size="sm" className="h-9 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs">
							<Store className="size-3.5" />
							Counter POS
						</Button>
					</Link>
				</div>
			</div>

			{/* 2. TIME RANGE PILLS & SECONDARY FILTERS */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-4">
				{/* Preset Time Range Pills */}
				<div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b">
					<div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
						<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1.5 flex items-center gap-1">
							<Calendar className="size-3.5" />
							Period:
						</span>
						{TIME_PRESETS.map((preset) => {
							const isActive = timeRange === preset.id;
							return (
								<button
									key={preset.id}
									type="button"
									onClick={() => setTimeRange(preset.id)}
									className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
										isActive
											? "bg-primary text-primary-foreground shadow-2xs scale-[1.02]"
											: "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}
								>
									{preset.label}
								</button>
							);
						})}
					</div>

					<div className="flex items-center gap-2">
						<span className="text-xs text-muted-foreground">Rows:</span>
						<Select value={String(limit)} onValueChange={(val) => setLimit(Number(val))}>
							<SelectTrigger className="w-20 h-8 text-xs font-semibold bg-background">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="25" className="text-xs">25</SelectItem>
								<SelectItem value="50" className="text-xs">50</SelectItem>
								<SelectItem value="100" className="text-xs">100</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Custom Date Inputs (if 'custom' selected) */}
				{timeRange === "custom" && (
					<div className="p-3 rounded-xl border bg-muted/30 flex items-center gap-3 flex-wrap animate-in fade-in">
						<div className="flex items-center gap-2 text-xs">
							<span className="font-semibold text-muted-foreground">From Date:</span>
							<Input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="h-8 text-xs bg-background w-36"
							/>
						</div>
						<div className="flex items-center gap-2 text-xs">
							<span className="font-semibold text-muted-foreground">To Date:</span>
							<Input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="h-8 text-xs bg-background w-36"
							/>
						</div>
					</div>
				)}

				{/* Secondary Filters Bar */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{/* Sort Metric */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
							<SlidersHorizontal className="size-3 text-primary" />
							Rank Best Sellers By:
						</label>
						<Select
							value={sortBy}
							onValueChange={(val) => setSortBy(val as "quantity" | "revenue" | "orders")}
						>
							<SelectTrigger className="w-full h-9 text-xs font-semibold bg-background">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="quantity" className="text-xs">
									📦 Highest Units Sold (Pcs)
								</SelectItem>
								<SelectItem value="revenue" className="text-xs">
									💰 Highest Sales Revenue (PKR)
								</SelectItem>
								<SelectItem value="orders" className="text-xs">
									🧾 Most Frequently Invoiced
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Bike Model Filter */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
							<Bike className="size-3 text-primary" />
							Bike Model:
						</label>
						<Select value={selectedModel} onValueChange={(val) => { if (val) setSelectedModel(val); }}>
							<SelectTrigger className="w-full h-9 text-xs font-semibold bg-background">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{BIKE_MODELS.map((m) => (
									<SelectItem key={m} value={m} className="text-xs">
										{m}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Category Filter */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
							<Layers className="size-3 text-primary" />
							Product Category:
						</label>
						<Select value={selectedCategory} onValueChange={(val) => { if (val) setSelectedCategory(val); }}>
							<SelectTrigger className="w-full h-9 text-xs font-semibold bg-background">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CATEGORIES.map((c) => (
									<SelectItem key={c} value={c} className="text-xs">
										{c}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{/* 3. DYNAMIC CONTENT OR SKELETON */}
			{isLoading ? (
				<TopSellingSkeleton />
			) : (
				<div className="space-y-6">
					{/* KPI Summary Cards */}
					<TopSellingKpiCards summary={summary} highlights={highlights} />

					{/* Main Grid: Products Table (2/3) + Top Invoices (1/3) */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2">
							<TopSellingTable
								products={topSellingProducts}
								sortBy={sortBy}
								onSortChange={(metric) => setSortBy(metric)}
								periodLabel={currentPresetLabel}
							/>
						</div>

						<div className="lg:col-span-1">
							<TopOrdersCard
								topOrders={topOrders}
								categoryBreakdown={categoryBreakdown}
								bikeModelBreakdown={bikeModelBreakdown}
								periodLabel={currentPresetLabel}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
