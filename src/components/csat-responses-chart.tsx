"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Store } from "lucide-react";

const chartData = [
	{ branch: "Saddar Main", sales: 2650, orders: 810 },
	{ branch: "Gulshan Hub", sales: 1420, orders: 420 },
	{ branch: "DHA Counter", sales: 780, orders: 198 },
] as const;

const chartConfig = {
	sales: {
		label: "Revenue (Rs. '000)",
		color: "var(--chart-1, #10b981)",
	},
	orders: {
		label: "Completed Orders",
		color: "var(--chart-2, #3b82f6)",
	},
} satisfies ChartConfig;

export function CsatResponsesChart({
	className,
	...props
}: ComponentProps<typeof Card>) {
	return (
		<Card
			className={cn("shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="space-y-1">
				<div className="flex flex-wrap items-center gap-2">
					<CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
						<Store className="size-4 text-primary" />
						Branch Counter Performance
					</CardTitle>
				</div>
				<CardDescription className="text-xs">
					Monthly revenue & order count comparison across the 3 physical shop branches.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer className="aspect-16/7 w-full max-h-[220px]" config={chartConfig}>
					<BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
						<CartesianGrid className="stroke-border" vertical={false} />
						<XAxis
							axisLine={false}
							dataKey="branch"
							tickLine={false}
							tickMargin={8}
							className="text-xs font-semibold"
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tickMargin={8}
							tickFormatter={(val) => `Rs.${val}k`}
							width={54}
							className="text-xs font-mono"
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="min-w-36 font-mono"
									formatter={(value, name) =>
										name === "sales"
											? [`Rs. ${Number(value) * 1000} PKR`, "Revenue"]
											: [`${value} Orders`, "Orders"]
									}
								/>
							}
						/>
						<Bar dataKey="sales" fill="var(--chart-1, #10b981)" radius={[6, 6, 0, 0]} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
