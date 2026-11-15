"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { useMemo } from "react";
import { Pie, PieChart, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchDashboardAnalytics } from "@/lib/api/dashboard/analytics-api";
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
import { PieChart as PieChartIcon, Loader2 } from "lucide-react";

type ChannelDatum = {
	name: string;
	share: number;
	color: string;
	count?: number;
	total?: number;
};

const defaultOrderTypes: ChannelDatum[] = [
	{ name: "Wholesale Dealers", share: 0, color: "#10b981" },
	{ name: "Retail Walk-in", share: 0, color: "#0284c7" },
	{ name: "Mechanics / Accounts", share: 0, color: "#f59e0b" },
];

const chartConfig = {
	share: {
		label: "Share %",
	},
	wholesale: {
		label: "Wholesale Dealers",
		color: "#10b981",
	},
	retail: {
		label: "Retail Walk-in",
		color: "#0284c7",
	},
	workshop: {
		label: "Mechanics / Accounts",
		color: "#f59e0b",
	},
} satisfies ChartConfig;

export function ChannelBreakdownChart({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const { data: analyticsRes, isLoading } = useQuery({
		queryKey: queryKeys.dashboard.analytics(30),
		queryFn: () => fetchDashboardAnalytics(30),
		staleTime: 1000 * 60 * 3,
	});

	const channelData: ChannelDatum[] = useMemo(() => {
		if (analyticsRes?.data?.salesByOrderType && analyticsRes.data.salesByOrderType.length > 0) {
			return analyticsRes.data.salesByOrderType;
		}
		return defaultOrderTypes;
	}, [analyticsRes]);

	const totalOrders = analyticsRes?.data?.summary?.totalOrders ?? 0;
	const hasSales = totalOrders > 0;

	// For the donut chart display, if no sales yet, show a clean neutral circular outline
	const pieData = useMemo(() => {
		if (!hasSales) {
			return [{ name: "Starting Fresh", share: 100, color: "var(--muted, #e5e7eb)" }];
		}
		return channelData;
	}, [channelData, hasSales]);

	return (
		<Card
			className={cn("flex flex-col shadow-none dark:ring-0 justify-between", className)}
			{...props}
		>
			<CardHeader className="space-y-1 pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
						<PieChartIcon className="size-4 text-primary" />
						Sales by Order Type
					</CardTitle>
					{isLoading && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
				</div>
				<CardDescription className="text-xs">
					Share of wholesale vs counter retail sales.
				</CardDescription>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col items-center justify-between gap-4 pt-2">
				{/* Centered Donut Chart */}
				<div className="w-full flex items-center justify-center relative">
					<ChartContainer
						className="aspect-square w-full max-w-[170px] max-h-[170px]"
						config={chartConfig}
					>
						<PieChart>
							{hasSales && (
								<ChartTooltip
									content={
										<ChartTooltipContent
											className="min-w-32 font-mono text-xs"
											formatter={(value) => [`${value}%`, "Share"]}
										/>
									}
								/>
							)}
							<Pie
								data={pieData}
								dataKey="share"
								nameKey="name"
								innerRadius={48}
								outerRadius={74}
								strokeWidth={3}
								stroke="var(--background)"
								cx="50%"
								cy="50%"
								paddingAngle={hasSales ? 2 : 0}
							>
								{pieData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ChartContainer>

					{!hasSales && (
						<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
							<span className="text-xs font-semibold text-muted-foreground font-mono">0%</span>
							<span className="text-[10px] text-muted-foreground/80">Zero Sales</span>
						</div>
					)}
				</div>

				{/* Breakdown List */}
				<div className="w-full flex flex-col gap-2 pt-3 border-t border-border/60">
					{channelData.map((item) => (
						<div
							key={item.name}
							className="flex items-center justify-between text-xs py-0.5"
						>
							<div className="flex items-center gap-2 min-w-0">
								<span
									className="size-2.5 rounded-full shrink-0"
									style={{ backgroundColor: item.color }}
								/>
								<span className="text-muted-foreground truncate font-medium">
									{item.name}
								</span>
							</div>
							<span className="font-mono font-bold text-foreground shrink-0 ml-2">
								{item.share}%
							</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
