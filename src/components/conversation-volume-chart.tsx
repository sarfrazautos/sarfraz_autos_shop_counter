"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	formatChartAxisTick,
	formatChartTooltipDate,
	parseIsoCalendarDate,
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
import { TrendingUp, Banknote } from "lucide-react";

type PeriodDays = 7 | 30 | 60;

type VolumeRow = {
	date: string;
	salesRevenue: number; // in Thousands of PKR (k)
};

/**
 * Realistic Spare Parts Daily Sales Volume data.
 */
const chartData: VolumeRow[] = [
	{ date: "2026-09-15", salesRevenue: 142 },
	{ date: "2026-09-16", salesRevenue: 156 },
	{ date: "2026-09-17", salesRevenue: 168 },
	{ date: "2026-09-18", salesRevenue: 182 },
	{ date: "2026-09-19", salesRevenue: 175 },
	{ date: "2026-09-20", salesRevenue: 190 },
	{ date: "2026-09-21", salesRevenue: 145 },
	{ date: "2026-09-22", salesRevenue: 162 },
	{ date: "2026-09-23", salesRevenue: 178 },
	{ date: "2026-09-24", salesRevenue: 185 },
	{ date: "2026-09-25", salesRevenue: 210 },
	{ date: "2026-09-26", salesRevenue: 195 },
	{ date: "2026-09-27", salesRevenue: 150 },
	{ date: "2026-09-28", salesRevenue: 172 },
	{ date: "2026-09-29", salesRevenue: 188 },
	{ date: "2026-09-30", salesRevenue: 205 },
	{ date: "2026-10-01", salesRevenue: 220 },
	{ date: "2026-10-02", salesRevenue: 198 },
	{ date: "2026-10-03", salesRevenue: 215 },
	{ date: "2026-10-04", salesRevenue: 160 },
	{ date: "2026-10-05", salesRevenue: 175 },
	{ date: "2026-10-06", salesRevenue: 192 },
	{ date: "2026-10-07", salesRevenue: 210 },
	{ date: "2026-10-08", salesRevenue: 235 },
	{ date: "2026-10-09", salesRevenue: 240 },
	{ date: "2026-10-10", salesRevenue: 218 },
	{ date: "2026-10-11", salesRevenue: 170 },
	{ date: "2026-10-12", salesRevenue: 185 },
	{ date: "2026-10-13", salesRevenue: 202 },
	{ date: "2026-10-14", salesRevenue: 225 },
	{ date: "2026-10-15", salesRevenue: 245 },
	{ date: "2026-10-16", salesRevenue: 230 },
	{ date: "2026-10-17", salesRevenue: 215 },
	{ date: "2026-10-18", salesRevenue: 180 },
	{ date: "2026-10-19", salesRevenue: 195 },
	{ date: "2026-10-20", salesRevenue: 220 },
	{ date: "2026-10-21", salesRevenue: 238 },
	{ date: "2026-10-22", salesRevenue: 260 },
	{ date: "2026-10-23", salesRevenue: 252 },
	{ date: "2026-10-24", salesRevenue: 230 },
	{ date: "2026-10-25", salesRevenue: 190 },
	{ date: "2026-10-26", salesRevenue: 205 },
	{ date: "2026-10-27", salesRevenue: 225 },
	{ date: "2026-10-28", salesRevenue: 248 },
	{ date: "2026-10-29", salesRevenue: 270 },
	{ date: "2026-10-30", salesRevenue: 262 },
	{ date: "2026-10-31", salesRevenue: 240 },
	{ date: "2026-11-01", salesRevenue: 215 },
	{ date: "2026-11-02", salesRevenue: 235 },
	{ date: "2026-11-03", salesRevenue: 250 },
	{ date: "2026-11-04", salesRevenue: 265 },
	{ date: "2026-11-05", salesRevenue: 285 },
	{ date: "2026-11-06", salesRevenue: 275 },
	{ date: "2026-11-07", salesRevenue: 290 },
	{ date: "2026-11-08", salesRevenue: 220 },
	{ date: "2026-11-09", salesRevenue: 245 },
	{ date: "2026-11-10", salesRevenue: 260 },
	{ date: "2026-11-11", salesRevenue: 280 },
	{ date: "2026-11-12", salesRevenue: 295 },
	{ date: "2026-11-13", salesRevenue: 310 },
];

const volumeChartReferenceDate = "2026-11-13";

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

	const chartRows = useMemo(() => {
		const startDate = new Date(volumeChartReferenceDate);
		startDate.setDate(startDate.getDate() - periodDays);
		return chartData.filter(
			(item) => parseIsoCalendarDate(item.date) >= startDate
		);
	}, [periodDays]);

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
						<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
							<TrendingUp className="size-3" />
							Consistent Growth
						</span>
					</div>
					<CardDescription className="text-xs">
						Daily motorcycle spare parts counter sales & wholesale billing in PKR (Rs. Thousands).
					</CardDescription>
				</div>
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
