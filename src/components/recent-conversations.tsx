"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { INITIAL_ORDERS } from "@/components/Orders/types";

export function RecentConversations({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const recentOrders = INITIAL_ORDERS.slice(0, 5);

	return (
		<Card
			className={cn("shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
				<div className="space-y-1">
					<CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
						<ShoppingBag className="size-4 text-primary" />
						Recent Counter & Wholesale Orders
					</CardTitle>
					<CardDescription className="text-xs">
						Latest invoices generated across retail counter & wholesale orders.
					</CardDescription>
				</div>
				<Button
					variant="ghost"
					size="xs"
					render={<Link href="/dashboard/orders" />}
					nativeButton={false}
					className="text-xs text-primary hover:text-primary/80 gap-1 cursor-pointer"
				>
					<span>View Orders</span>
					<ArrowRight className="size-3" />
				</Button>
			</CardHeader>
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow className="border-border/60 hover:bg-transparent">
							<TableHead className="w-24 text-[11px]">Invoice #</TableHead>
							<TableHead className="text-[11px]">Customer & City</TableHead>
							<TableHead className="text-[11px]">Type</TableHead>
							<TableHead className="text-right text-[11px]">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{recentOrders.map((order) => (
							<TableRow key={order.id} className="border-border/60 hover:bg-muted/40">
								<TableCell className="font-mono text-xs font-semibold text-foreground py-2.5">
									{order.invoiceNumber}
								</TableCell>
								<TableCell className="py-2.5">
									<div className="font-semibold text-xs text-foreground truncate max-w-[160px]">
										{order.customerName}
									</div>
									<div className="text-[10px] text-muted-foreground">
										{order.customerCity} • {order.items.length} parts
									</div>
								</TableCell>
								<TableCell className="py-2.5">
									<Badge
										variant={order.type === "Wholesale" ? "secondary" : "outline"}
										className="text-[10px] py-0 px-1.5"
									>
										{order.type}
									</Badge>
								</TableCell>
								<TableCell className="text-right font-mono text-xs font-bold text-foreground py-2.5">
									Rs. {order.totalAmount.toLocaleString()}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
