"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, useId, useMemo, useState, useEffect } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchDashboardAnalytics } from "@/lib/api/dashboard/analytics-api";
import {
	formatChartAxisTick,
	formatChartTooltipDate,
} from "@/components/formater";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Banknote, Loader2 } from "lucide-react";

type PeriodDays = 7 | 30 | 60;

type VolumeRow = {
	date: string;
	salesRevenue: number; // in Thousands of PKR (k)
};

const chartConfig = {
	salesRevenue: {
		label: "Daily Sales (Rs. '000)",
		color: "var(--color-primary, #10b981)",
	},
} satisfies ChartConfig;

export function ConversationVolumeChart({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const reactId = useId();
	const idAreaGradient = `sales-area-${reactId.replace(/:/g, "")}`;
	const [periodDays, setPeriodDays] = useState<PeriodDays>(30);

	const { data: analyticsRes, isLoading } = useQuery({
		queryKey: queryKeys.dashboard.analytics(periodDays),
		queryFn: () => fetchDashboardAnalytics(periodDays),
		staleTime: 1000 * 60 * 3,
	});

	const [chartRows, setChartRows] = useState<VolumeRow[]>([]);

	useEffect(() => {
		if (analyticsRes?.data?.dailyRevenue && analyticsRes.data.dailyRevenue.length > 0) {
			setChartRows(
				analyticsRes.data.dailyRevenue.map((d) => ({
					date: d.date,
					salesRevenue: d.salesRevenue,
				}))
			);
		} else {
			const fallback: VolumeRow[] = [];
			const now = new Date();
			for (let i = periodDays - 1; i >= 0; i--) {
				const d = new Date(now);
				d.setDate(d.getDate() - i);
				fallback.push({
					date: d.toISOString().split("T")[0],
					salesRevenue: 0,
				});
			}
			setChartRows(fallback);
		}
	}, [analyticsRes, periodDays]);

	const totalSales = analyticsRes?.data?.summary?.totalSalesPKR ?? 0;

	let xAxisMinTickGap: number | undefined;
	if (periodDays <= 7) {
		xAxisMinTickGap = undefined;
	} else if (periodDays >= 60) {
		xAxisMinTickGap = 20;
	} else {
		xAxisMinTickGap = 28;
	}

	return (
		<Card
			className={cn(
				"shadow-none md:col-span-2 lg:col-span-3 dark:ring-0",
				className
			)}
			{...props}
		>
			<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0 space-y-1">
					<div className="flex items-center gap-2">
						<CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
							<Banknote className="size-4 text-emerald-600" />
							Sales Revenue Generated
						</CardTitle>
						{totalSales > 0 ? (
							<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
								<TrendingUp className="size-3" />
								Consistent Growth
							</span>
						) : (
							<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1">
								<TrendingUp className="size-3" />
								Live Real-Time
							</span>
						)}
					</div>
					<CardDescription className="text-xs">
						Daily motorcycle spare parts counter sales & wholesale billing in PKR (Rs. Thousands).
					</CardDescription>
				</div>
				<div className="flex items-center gap-2">
					{isLoading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
					<Select
						onValueChange={(v) => {
							const n = Number(v);
							setPeriodDays(n as PeriodDays);
						}}
						value={String(periodDays)}
					>
						<SelectTrigger
							aria-label="Sales volume time range"
							className="w-full min-w-36 sm:w-fit h-8 text-xs bg-background"
							size="sm"
						>
							<SelectValue placeholder="Range" />
						</SelectTrigger>
						<SelectContent align="end">
							<SelectItem value="7" className="text-xs">Last 7 days</SelectItem>
							<SelectItem value="30" className="text-xs">Last 30 days</SelectItem>
							<SelectItem value="60" className="text-xs">Last 60 days</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer className="aspect-22/8 w-full" config={chartConfig}>
					<AreaChart
						accessibilityLayer
						data={chartRows}
						margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
					>
						<defs>
							<linearGradient id={idAreaGradient} x1="0" x2="0" y1="0" y2="1">
								<stop
									offset="0%"
									stopColor="var(--chart-1, #10b981)"
									stopOpacity={0.45}
								/>
								<stop
									offset="55%"
									stopColor="var(--chart-1, #10b981)"
									stopOpacity={0.12}
								/>
								<stop
									offset="100%"
									stopColor="var(--chart-1, #10b981)"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid className="stroke-border" vertical={false} />
						<XAxis
							axisLine={false}
							dataKey="date"
							interval={periodDays <= 7 ? 0 : "preserveStartEnd"}
							minTickGap={xAxisMinTickGap}
							tickFormatter={(value) =>
								formatChartAxisTick(String(value), periodDays)
							}
							tickLine={false}
							tickMargin={8}
						/>
						<YAxis
							axisLine={false}
							tick={{ className: "tabular-nums" }}
							tickLine={false}
							tickMargin={8}
							width={42}
							tickFormatter={(v) => `Rs.${v}k`}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="min-w-36 font-mono"
									indicator="line"
									formatter={(value) => `Rs. ${Number(value) * 1000} PKR`}
									labelFormatter={(_, payload) => {
										const row = payload?.[0]?.payload as VolumeRow | undefined;
										if (!row?.date) {
											return "";
										}
										return formatChartTooltipDate(row.date, "long");
									}}
								/>
							}
							cursor={false}
						/>
						<Area
							dataKey="salesRevenue"
							dot={false}
							fill={`url(#${idAreaGradient})`}
							fillOpacity={1}
							stroke="var(--chart-1, #10b981)"
							strokeWidth={2}
							type="monotone"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
