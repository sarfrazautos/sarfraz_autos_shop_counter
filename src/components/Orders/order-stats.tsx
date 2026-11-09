import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import type { OrderRecord } from "./types";

interface OrderStatsProps {
	orders: OrderRecord[];
}

export function OrderStatsCards({ orders }: OrderStatsProps) {
	const totalOrders = orders.length;
	const totalRevenue = orders
		.filter((o) => o.status !== "Cancelled")
		.reduce((sum, o) => sum + o.totalAmount, 0);
	const pendingCount = orders.filter((o) => o.status === "Pending" || o.status === "In-Progress").length;

	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
			{/* 1. Total Orders */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-muted-foreground">Total Invoices & Orders</p>
						<div className="flex items-baseline gap-2 mt-1">
							<span className="font-heading text-2xl font-bold tracking-tight text-foreground">
								{totalOrders}
							</span>
							<span className="text-[11px] text-muted-foreground font-medium">Billed to Date</span>
						</div>
					</div>
					<div className="flex size-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 shrink-0">
						<ShoppingBag className="size-5" />
					</div>
				</CardContent>
			</Card>

			{/* 2. Total Billed Volume */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-muted-foreground">Sales Revenue Billed</p>
						<div className="flex items-baseline gap-2 mt-1">
							<span className="font-heading text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
								Rs. {totalRevenue.toLocaleString()}
							</span>
						</div>
					</div>
					<div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
						<TrendingUp className="size-5" />
					</div>
				</CardContent>
			</Card>

			{/* 3. Pending / Active Processing */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-muted-foreground">Pending / In-Progress</p>
						<div className="flex items-baseline gap-2 mt-1">
							<span className="font-heading text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
								{pendingCount}
							</span>
							<span className="text-[11px] text-amber-600/80 font-medium">Pending Payment</span>
						</div>
					</div>
					<div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
						<Clock className="size-5" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

