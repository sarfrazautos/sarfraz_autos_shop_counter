"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { Bike, Loader2 } from "lucide-react";

type BikeModelRow = {
	model: string;
	partsSold: number;
};

const defaultBikeModels: BikeModelRow[] = [
	{ model: "Honda CD70", partsSold: 0 },
	{ model: "Honda CG125", partsSold: 0 },
	{ model: "Crown 70cc", partsSold: 0 },
	{ model: "Suzuki GS150", partsSold: 0 },
	{ model: "Yamaha YBR", partsSold: 0 },
];

const chartConfig = {
	partsSold: {
		label: "Spare Parts Sold",
		color: "var(--chart-2, #3b82f6)",
	},
} satisfies ChartConfig;

export function FirstReplyTimeChart({
	className,
	...props
}: ComponentProps<typeof Card>) {
	const { data: analyticsRes, isLoading } = useQuery({
		queryKey: queryKeys.dashboard.analytics(30),
		queryFn: () => fetchDashboardAnalytics(30),
		staleTime: 1000 * 60 * 3,
	});

	const bikeModelData: BikeModelRow[] = useMemo(() => {
		if (analyticsRes?.data?.topBikeModels && analyticsRes.data.topBikeModels.length > 0) {
			return analyticsRes.data.topBikeModels;
		}
		return defaultBikeModels;
	}, [analyticsRes]);

	return (
		<Card
			className={cn("shadow-none md:col-span-2 dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="space-y-1">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
						<Bike className="size-4 text-primary" />
						Top Bike Models Spare Parts Demand
					</CardTitle>
					{isLoading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
				</div>
				<CardDescription className="text-xs">
					Unit volume of parts sold by motorcycle model this month.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer className="aspect-16/7 w-full max-h-[220px]" config={chartConfig}>
					<BarChart accessibilityLayer data={bikeModelData} layout="vertical" margin={{ left: 16, right: 16, top: 4, bottom: 4 }}>
						<CartesianGrid className="stroke-border" horizontal={false} />
						<XAxis type="number" axisLine={false} tickLine={false} tickMargin={8} className="text-xs font-mono" />
						<YAxis
							type="category"
							dataKey="model"
							axisLine={false}
							tickLine={false}
							tickMargin={8}
							width={88}
							className="text-xs font-semibold"
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="min-w-32 font-mono"
									formatter={(val) => [`${val} Units`, "Parts Sold"]}
								/>
							}
						/>
						<Bar dataKey="partsSold" fill="var(--chart-2, #3b82f6)" radius={[0, 6, 6, 0]} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
