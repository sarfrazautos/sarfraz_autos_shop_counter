"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Crown,
	AlertTriangle,
	ExternalLink,
	Search,
	TrendingUp,
	Package,
	ArrowUpDown,
	Download,
	Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TopSellingProductItem } from "@/lib/api/reports/reports-api";

interface TopSellingTableProps {
	products: TopSellingProductItem[];
	sortBy: "quantity" | "revenue" | "orders";
	onSortChange: (sortBy: "quantity" | "revenue" | "orders") => void;
	periodLabel: string;
}

export function TopSellingTable({
	products,
	sortBy,
	onSortChange,
	periodLabel,
}: TopSellingTableProps) {
	const [tableSearch, setTableSearch] = useState("");

	const filtered = products.filter((p) => {
		if (!tableSearch.trim()) return true;
		const query = tableSearch.toLowerCase();
		return (
			p.name.toLowerCase().includes(query) ||
			p.sku.toLowerCase().includes(query) ||
			p.bikeModel.toLowerCase().includes(query) ||
			p.category.toLowerCase().includes(query)
		);
	});

	// Maximum units sold for the relative volume progress bar
	const maxUnits = products.length > 0 ? Math.max(...products.map((p) => p.unitsSold), 1) : 1;

	// Export table as CSV
	const handleExportCSV = () => {
		if (products.length === 0) return;
		const headers = [
			"Rank",
			"Product Name",
			"SKU",
			"Category",
			"Bike Model",
			"Units Sold",
			"Total Revenue (PKR)",
			"Avg Rate (PKR)",
			"Orders Count",
			"Current Stock",
			"Stock Status",
		];
		const rows = products.map((p) => [
			p.rank,
			`"${p.name.replace(/"/g, '""')}"`,
			`"${p.sku}"`,
			`"${p.category}"`,
			`"${p.bikeModel}"`,
			p.unitsSold,
			p.totalRevenue,
			p.averageRate,
			p.ordersCount,
			p.currentStock,
			p.isLowStock ? "Low Stock" : "In Stock",
		]);

		const csvContent =
			"data:text/csv;charset=utf-8," +
			[headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", `Top_Selling_Products_${periodLabel.replace(/\s+/g, "_")}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
			{/* Table Header Controls */}
			<div className="p-4 sm:p-5 border-b bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h3 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
						<Package className="size-4 text-primary" />
						Top Selling Products
						<Badge variant="outline" className="text-xs font-mono font-bold bg-muted/50">
							{filtered.length} Items
						</Badge>
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						Ranked by {sortBy === "revenue" ? "sales revenue" : sortBy === "orders" ? "order appearances" : "units sold"} for {periodLabel}
					</p>
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					{/* Search in results */}
					<div className="relative w-full sm:w-48">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search table..."
							value={tableSearch}
							onChange={(e) => setTableSearch(e.target.value)}
							className="h-8 pl-8 text-xs bg-background"
						/>
					</div>

					{/* Export Button */}
					<Button
						variant="outline"
						size="sm"
						onClick={handleExportCSV}
						className="h-8 text-xs font-semibold gap-1.5 cursor-pointer hover:bg-muted"
					>
						<Download className="size-3.5" />
						Export CSV
					</Button>
				</div>
			</div>

			{/* Table Content */}
			<div className="overflow-x-auto">
				<table className="w-full text-xs text-left">
					<thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
						<tr>
							<th className="py-3 px-3 w-14 text-center">Rank</th>
							<th className="py-3 px-3 min-w-[200px]">Product / Description</th>
							<th className="py-3 px-3 w-32">
								<button
									type="button"
									onClick={() => onSortChange("quantity")}
									className="flex items-center gap-1 hover:text-foreground font-semibold cursor-pointer"
								>
									Units Sold
									<ArrowUpDown className={`size-3 ${sortBy === "quantity" ? "text-primary" : "opacity-40"}`} />
								</button>
							</th>
							<th className="py-3 px-3 w-36 text-right">
								<button
									type="button"
									onClick={() => onSortChange("revenue")}
									className="flex items-center gap-1 ml-auto hover:text-foreground font-semibold cursor-pointer"
								>
									Revenue (PKR)
									<ArrowUpDown className={`size-3 ${sortBy === "revenue" ? "text-primary" : "opacity-40"}`} />
								</button>
							</th>
							<th className="py-3 px-3 w-28 text-center">Avg Rate</th>
							<th className="py-3 px-3 w-24 text-center">
								<button
									type="button"
									onClick={() => onSortChange("orders")}
									className="flex items-center gap-1 mx-auto hover:text-foreground font-semibold cursor-pointer"
								>
									Invoices
									<ArrowUpDown className={`size-3 ${sortBy === "orders" ? "text-primary" : "opacity-40"}`} />
								</button>
							</th>
							<th className="py-3 px-3 w-32 text-center">Current Stock</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{filtered.length === 0 ? (
							<tr>
								<td colSpan={7} className="py-12 text-center text-muted-foreground">
									<Package className="size-8 mx-auto mb-2 opacity-30" />
									<p className="font-semibold text-sm">No sales data found</p>
									<p className="text-xs mt-1">Try switching the date filter or clearing search filters.</p>
								</td>
							</tr>
						) : (
							filtered.map((item) => {
								const volumePercent = Math.min(100, Math.round((item.unitsSold / maxUnits) * 100));

								return (
									<tr key={item.productId} className="hover:bg-muted/30 transition-colors">
										{/* Rank */}
										<td className="py-3 px-3 text-center">
											{item.rank === 1 ? (
												<div className="size-7 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 font-black text-xs flex items-center justify-center mx-auto border border-amber-500/30 shadow-2xs">
													<Crown className="size-3.5 fill-amber-500" />
												</div>
											) : item.rank === 2 ? (
												<div className="size-7 rounded-xl bg-slate-300/40 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center mx-auto border border-slate-400/40 shadow-2xs">
													#2
												</div>
											) : item.rank === 3 ? (
												<div className="size-7 rounded-xl bg-amber-700/15 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center mx-auto border border-amber-700/30 shadow-2xs">
													#3
												</div>
											) : (
												<span className="font-mono font-bold text-muted-foreground text-xs">
													#{item.rank}
												</span>
											)}
										</td>

										{/* Product Description */}
										<td className="py-3 px-3">
											<div className="font-bold text-foreground text-xs sm:text-sm line-clamp-1">
												{item.name}
											</div>
											<div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground mt-0.5">
												<span className="font-mono font-semibold text-foreground/80">{item.sku}</span>
												<span>•</span>
												<span>{item.bikeModel}</span>
												<span>•</span>
												<span className="text-muted-foreground/80">{item.category}</span>
											</div>
										</td>

										{/* Units Sold + Relative Volume Bar */}
										<td className="py-3 px-3">
											<div className="flex items-center justify-between font-mono font-bold text-xs sm:text-sm text-foreground">
												<span>{item.unitsSold.toLocaleString()} Pcs</span>
												<span className="text-[10px] text-muted-foreground font-normal">
													{item.shareOfUnits}%
												</span>
											</div>
											<div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
												<div
													className="bg-primary h-full rounded-full transition-all duration-300"
													style={{ width: `${volumePercent}%` }}
												/>
											</div>
										</td>

										{/* Total Revenue */}
										<td className="py-3 px-3 text-right font-mono font-black text-xs sm:text-sm text-foreground">
											Rs. {item.totalRevenue.toLocaleString()}
										</td>

										{/* Avg Rate */}
										<td className="py-3 px-3 text-center font-mono text-muted-foreground text-xs">
											Rs. {item.averageRate.toLocaleString()}
										</td>

										{/* Invoices Count */}
										<td className="py-3 px-3 text-center">
											<Badge variant="outline" className="text-[11px] font-mono font-bold bg-muted/40">
												{item.ordersCount}
											</Badge>
										</td>

										{/* Current Stock */}
										<td className="py-3 px-3 text-center">
											{item.isLowStock ? (
												<div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
													<AlertTriangle className="size-3 shrink-0" />
													<span>{item.currentStock} (Low)</span>
												</div>
											) : (
												<div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
													<span>{item.currentStock} in stock</span>
												</div>
											)}
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
