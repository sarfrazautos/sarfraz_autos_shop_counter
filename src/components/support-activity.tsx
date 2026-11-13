"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Boxes,
	Receipt,
	BadgeDollarSign,
	UserCheck,
	ArrowRight,
	Activity,
} from "lucide-react";

const activityItems = [
	{
		title: "Stock Dispatched: 45 units Crown Piston Kit to Saddar Main Counter",
		time: "12 min ago",
		icon: <Boxes className="size-3.5 text-sky-600" />,
		bg: "bg-sky-500/10",
	},
	{
		title: "Invoice #SA-64276 issued for Afraz Auto Works (Rs. 54,230)",
		time: "28 min ago",
		icon: <Receipt className="size-3.5 text-emerald-600" />,
		bg: "bg-emerald-500/10",
	},
	{
		title: "Bulk Price Update applied: +5% on Engine & Transmission",
		time: "1 hr ago",
		icon: <BadgeDollarSign className="size-3.5 text-amber-600" />,
		bg: "bg-amber-500/10",
	},
	{
		title: "Staff Assignment: Kashif Raza checked-in at DHA Counter",
		time: "3 hr ago",
		icon: <UserCheck className="size-3.5 text-purple-600" />,
		bg: "bg-purple-500/10",
	},
] as const;

export function SupportActivity({
	className,
	...props
}: ComponentProps<typeof Card>) {
	return (
		<Card
			className={cn("shadow-none md:col-span-2 lg:col-span-4 dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
				<div className="space-y-1">
					<CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
						<Activity className="size-4 text-primary" />
						Counter & Inventory Live Activity
					</CardTitle>
					<CardDescription className="text-xs">
						Recent stock arrivals, price adjustments, and counter transactions.
					</CardDescription>
				</div>
				<Button
					variant="ghost"
					size="xs"
					render={<Link href="/dashboard/notifications" />}
					nativeButton={false}
					className="text-xs text-primary hover:text-primary/80 gap-1 cursor-pointer"
				>
					<span>View Activity Log</span>
					<ArrowRight className="size-3" />
				</Button>
			</CardHeader>
			<CardContent className="pt-1">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					{activityItems.map((item, idx) => (
						<div
							key={idx}
							className="p-3 rounded-xl border bg-muted/20 flex flex-col justify-between gap-2.5 hover:bg-muted/40 transition-colors"
						>
							<div className="flex items-start gap-2.5">
								<div
									className={cn(
										"size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
										item.bg
									)}
								>
									{item.icon}
								</div>
								<p className="text-xs font-semibold text-foreground leading-snug">
									{item.title}
								</p>
							</div>
							<span className="text-[10px] text-muted-foreground font-mono self-end">
								{item.time}
							</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
