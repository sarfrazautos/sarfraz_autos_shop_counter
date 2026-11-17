"use client";

import { Trophy, TrendingUp, Receipt, ShoppingBag, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TopSellingProductItem, TopSellingSummary } from "@/lib/api/reports/reports-api";

interface TopSellingKpiCardsProps {
	summary: TopSellingSummary;
	highlights: {
		topByVolume: TopSellingProductItem | null;
		topByRevenue: TopSellingProductItem | null;
		topByFrequency: TopSellingProductItem | null;
	};
}

export function TopSellingKpiCards({ summary, highlights }: TopSellingKpiCardsProps) {
	const { topByVolume, topByRevenue, topByFrequency } = highlights;

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{/* 1. #1 TOP SELLING BY VOLUME */}
			<div className="rounded-2xl border bg-card p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card">
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
						<Trophy className="size-4 text-amber-500" />
						#1 Top Volume
					</span>
					<Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
						{topByVolume ? `${topByVolume.unitsSold.toLocaleString()} Pcs` : "0 Pcs"}
					</Badge>
				</div>
				<div className="mt-3">
					<div
						className="font-bold text-sm sm:text-base text-foreground truncate"
						title={topByVolume?.name || "No sales data"}
					>
						{topByVolume?.name || "No sales recorded"}
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
						<span className="font-mono font-medium">{topByVolume?.sku || "SKU: N/A"}</span>
						<span>•</span>
						<span>{topByVolume?.bikeModel || "Universal"}</span>
					</div>
				</div>
				<div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
					<span>Share of units:</span>
					<strong className="text-amber-600 dark:text-amber-400 font-mono">
						{topByVolume?.shareOfUnits || 0}% of period
					</strong>
				</div>
			</div>

			{/* 2. HIGHEST REVENUE ITEM */}
			<div className="rounded-2xl border bg-card p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card">
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
						<TrendingUp className="size-4 text-emerald-500" />
						Highest Revenue
					</span>
					<Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold font-mono">
						{topByRevenue ? `Rs. ${topByRevenue.totalRevenue.toLocaleString()}` : "Rs. 0"}
					</Badge>
				</div>
				<div className="mt-3">
					<div
						className="font-bold text-sm sm:text-base text-foreground truncate"
						title={topByRevenue?.name || "No sales data"}
					>
						{topByRevenue?.name || "No sales recorded"}
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
						<span className="font-mono font-medium">{topByRevenue?.sku || "SKU: N/A"}</span>
						<span>•</span>
						<span>Avg Rs. {topByRevenue?.averageRate.toLocaleString() || 0}</span>
					</div>
				</div>
				<div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
					<span>Revenue share:</span>
					<strong className="text-emerald-600 dark:text-emerald-400 font-mono">
						{topByRevenue?.shareOfRev || 0}% of gross
					</strong>
				</div>
			</div>

			{/* 3. MOST FREQUENT INVOICED ITEM */}
			<div className="rounded-2xl border bg-card p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md border-sky-500/20 bg-gradient-to-br from-sky-500/5 via-card to-card">
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
						<Receipt className="size-4 text-sky-500" />
						Most Invoiced
					</span>
					<Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-[10px] font-bold font-mono">
						{topByFrequency ? `${topByFrequency.ordersCount} Bills` : "0 Bills"}
					</Badge>
				</div>
				<div className="mt-3">
					<div
						className="font-bold text-sm sm:text-base text-foreground truncate"
						title={topByFrequency?.name || "No sales data"}
					>
						{topByFrequency?.name || "No sales recorded"}
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
						<span className="font-mono font-medium">{topByFrequency?.category || "General"}</span>
						<span>•</span>
						<span>{topByFrequency?.bikeModel || "Universal"}</span>
					</div>
				</div>
				<div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
					<span>Invoice appearance:</span>
					<strong className="text-sky-600 dark:text-sky-400 font-mono">
						{summary.totalInvoicesCount > 0 && topByFrequency
							? `${Math.round((topByFrequency.ordersCount / summary.totalInvoicesCount) * 100)}% of orders`
							: "0%"}
					</strong>
				</div>
			</div>

			{/* 4. TOTAL PERIOD VOLUME & SALES */}
			<div className="rounded-2xl border bg-card p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
				<div className="flex items-center justify-between">
					<span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
						<ShoppingBag className="size-4 text-primary" />
						Period Summary
					</span>
					<Badge variant="outline" className="text-[10px] font-bold font-mono bg-primary/10 text-primary border-primary/20">
						{summary.totalInvoicesCount} Orders
					</Badge>
				</div>
				<div className="mt-3">
					<div className="text-xl sm:text-2xl font-black font-mono text-foreground">
						Rs. {summary.totalRevenue.toLocaleString()}
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
						<span>Total Units:</span>
						<strong className="text-foreground font-mono font-bold">
							{summary.totalUnitsSold.toLocaleString()} Pcs
						</strong>
					</div>
				</div>
				<div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
					<span>Unique items sold:</span>
					<strong className="text-foreground font-mono font-bold">
						{summary.distinctProductsCount} Products
					</strong>
				</div>
			</div>
		</div>
	);
}
