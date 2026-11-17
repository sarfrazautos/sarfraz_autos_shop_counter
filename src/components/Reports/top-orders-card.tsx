"use client";

import Link from "next/link";
import {
	ShoppingBag,
	ExternalLink,
	Building,
	FileText,
	ArrowUpRight,
	Bike,
	Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TopOrderItem } from "@/lib/api/reports/reports-api";

interface TopOrdersCardProps {
	topOrders: TopOrderItem[];
	categoryBreakdown: { category: string; totalUnits: number; totalRevenue: number }[];
	bikeModelBreakdown: { bikeModel: string; totalUnits: number; totalRevenue: number }[];
	periodLabel: string;
}

export function TopOrdersCard({
	topOrders,
	categoryBreakdown,
	bikeModelBreakdown,
	periodLabel,
}: TopOrdersCardProps) {
	const maxCatUnits =
		categoryBreakdown.length > 0
			? Math.max(...categoryBreakdown.map((c) => c.totalUnits), 1)
			: 1;

	return (
		<div className="space-y-6">
			{/* 1. TOP HIGH-VALUE ORDERS (MOST SEALED BIG ORDERS) */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-4">
				<div className="flex items-center justify-between border-b pb-3">
					<div>
						<h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
							<ShoppingBag className="size-4 text-primary" />
							Largest Orders Sealed
						</h3>
						<p className="text-[11px] text-muted-foreground mt-0.5">
							Top invoices by total amount for {periodLabel}
						</p>
					</div>
					<Badge variant="outline" className="text-[10px] font-mono font-bold bg-muted/40">
						{topOrders.length} Deals
					</Badge>
				</div>

				<div className="space-y-2.5">
					{topOrders.length === 0 ? (
						<div className="py-8 text-center text-xs text-muted-foreground">
							No orders recorded for this period.
						</div>
					) : (
						topOrders.map((order, idx) => {
							const formattedDate = order.createdAt
								? new Date(order.createdAt).toLocaleDateString("en-US", {
										day: "2-digit",
										month: "short",
										hour: "2-digit",
										minute: "2-digit",
								  })
								: "N/A";

							return (
								<div
									key={order.id}
									className="p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 text-xs"
								>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="font-mono font-bold text-foreground">
												#{order.invoiceNumber}
											</span>
											<Badge
												className={`text-[9px] px-1.5 py-0 font-semibold ${
													order.orderType === "Wholesale"
														? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
														: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30"
												}`}
												variant="outline"
											>
												{order.orderType}
											</Badge>
										</div>
										<div className="text-[11px] text-muted-foreground truncate mt-1">
											{order.customerName} • {order.customerCity}
										</div>
										<div className="text-[10px] text-muted-foreground/75 mt-0.5 font-mono">
											{formattedDate}
										</div>
									</div>

									<div className="text-right shrink-0">
										<div className="font-mono font-black text-xs sm:text-sm text-foreground">
											Rs. {order.totalAmount.toLocaleString()}
										</div>
										<Link
											href={`/dashboard/orders/edit/${order.invoiceNumber}`}
											className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-semibold mt-1"
										>
											View Deal <ArrowUpRight className="size-2.5" />
										</Link>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* 2. DEMAND BY CATEGORY */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
				<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
					<Layers className="size-4 text-primary" />
					Category Volume Share
				</h3>

				<div className="space-y-3">
					{categoryBreakdown.length === 0 ? (
						<div className="py-4 text-center text-xs text-muted-foreground">
							No category data.
						</div>
					) : (
						categoryBreakdown.map((cat) => {
							const percent = Math.min(100, Math.round((cat.totalUnits / maxCatUnits) * 100));

							return (
								<div key={cat.category} className="space-y-1">
									<div className="flex items-center justify-between text-xs">
										<span className="font-bold text-foreground text-[11px]">
											{cat.category}
										</span>
										<div className="flex items-center gap-2 text-[11px] font-mono">
											<strong className="text-foreground">{cat.totalUnits.toLocaleString()} Pcs</strong>
											<span className="text-muted-foreground text-[10px]">
												(Rs. {cat.totalRevenue.toLocaleString()})
											</span>
										</div>
									</div>
									<div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
										<div
											className="bg-primary/80 h-full rounded-full transition-all duration-300"
											style={{ width: `${percent}%` }}
										/>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* 3. DEMAND BY BIKE MODEL */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
				<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
					<Bike className="size-4 text-primary" />
					Top Bike Models
				</h3>

				<div className="flex flex-wrap gap-2">
					{bikeModelBreakdown.length === 0 ? (
						<div className="py-4 text-center text-xs text-muted-foreground w-full">
							No model data.
						</div>
					) : (
						bikeModelBreakdown.map((b) => (
							<div
								key={b.bikeModel}
								className="px-3 py-2 rounded-xl border bg-muted/30 text-xs flex flex-col gap-0.5 flex-1 min-w-[110px]"
							>
								<span className="font-bold text-foreground text-[11px] truncate">
									{b.bikeModel}
								</span>
								<div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground mt-0.5">
									<span>{b.totalUnits.toLocaleString()} Pcs</span>
									<span className="font-semibold text-primary">
										Rs. {Math.round(b.totalRevenue / 1000)}k
									</span>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
