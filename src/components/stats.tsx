"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchOrders } from "@/lib/api/orders/orders-api";
import { fetchProducts } from "@/lib/api/products/products-api";
import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Banknote,
	ShoppingBag,
	Boxes,
	Store,
} from "lucide-react";

export function DashboardStats() {
	const { data: ordersData } = useQuery({
		queryKey: queryKeys.orders.list({ page: 1 }),
		queryFn: () => fetchOrders({ page: 1 }),
		staleTime: 1000 * 60 * 5,
	});

	const { data: productsData } = useQuery({
		queryKey: queryKeys.products.list({ page: 1 }),
		queryFn: () => fetchProducts({ page: 1 }),
		staleTime: 1000 * 60 * 5,
	});

	const orders = ordersData?.data || [];
	const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
	const totalOrdersCount = ordersData?.pagination?.totalCount || orders.length;
	const totalUnits = orders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);
	const totalProducts = productsData?.pagination?.totalCount || 0;

	const stats = [
		{
			label: "Total Sales (This Month)",
			value: `Rs. ${totalSales.toLocaleString()}`,
			footnote: totalSales === 0 ? "Starting fresh from zero" : "Real-time sales counter",
			icon: <Banknote className="size-4 text-emerald-600" />,
		},
		{
			label: "Total Orders Completed",
			value: `${totalOrdersCount} Orders`,
			footnote: totalOrdersCount === 0 ? "No invoices placed yet" : "Counter & wholesale orders",
			icon: <ShoppingBag className="size-4 text-primary" />,
		},
		{
			label: "Spare Parts Dispatched",
			value: `${totalUnits} Units`,
			footnote: totalUnits === 0 ? "Awaiting customer orders" : "Dispatched to workshops",
			icon: <Boxes className="size-4 text-sky-600" />,
		},
		{
			label: "Active Inventory Catalog",
			value: `${totalProducts} Products`,
			footnote: totalProducts === 0 ? "Catalog clean (0 items)" : "Across all branches",
			icon: <Store className="size-4 text-purple-600" />,
		},
	];

	return (
		<>
			{stats.map((s) => (
				<Card className={cn("shadow-none dark:ring-0 border")} key={s.label}>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="font-medium text-muted-foreground text-xs">
							{s.label}
						</CardTitle>
						<div className="size-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
							{s.icon}
						</div>
					</CardHeader>
					<CardContent className="flex flex-col gap-1.5 pt-0">
						<p className="font-bold text-2xl tracking-tight text-foreground font-mono">
							{s.value}
						</p>
						<p className="text-xs text-muted-foreground">
							{s.footnote}
						</p>
					</CardContent>
				</Card>
			))}
		</>
	);
}
