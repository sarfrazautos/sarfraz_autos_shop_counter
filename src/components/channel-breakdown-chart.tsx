"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { LabelList, Pie, PieChart } from "recharts";
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
	ChartLegend,
	ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart as PieChartIcon } from "lucide-react";

type ChannelKey = "wholesale" | "retail" | "workshop";

type ChannelDatum = {
	channel: ChannelKey;
	share: number;
	fill: string;
};

const chartData: ChannelDatum[] = [
	{ channel: "wholesale", share: 55, fill: "var(--chart-1, #10b981)" },
	{ channel: "retail", share: 32, fill: "var(--chart-2, #3b82f6)" },
	{ channel: "workshop", share: 13, fill: "var(--chart-3, #f59e0b)" },
];

const chartConfig = {
	share: {
		label: "Share %",
	},
	wholesale: {
		label: "Wholesale Dealers (55%)",
		color: "var(--chart-1, #10b981)",
	},
	retail: {
		label: "Retail Walk-in (32%)",
		color: "var(--chart-2, #3b82f6)",
	},
	workshop: {
		label: "Mechanics / Accounts (13%)",
		color: "var(--chart-3, #f59e0b)",
	},
} satisfies ChartConfig;

export function ChannelBreakdownChart({
	className,
	...props
}: ComponentProps<typeof Card>) {
	return (
		<Card
			className={cn("flex flex-col shadow-none dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="space-y-1">
				<CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
					<PieChartIcon className="size-4 text-primary" />
					Sales by Order Type
				</CardTitle>
				<CardDescription className="text-xs">
					Share of wholesale vs counter retail sales.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col justify-center">
				<ChartContainer
					className="mx-auto aspect-square w-full max-w-[210px]"
					config={chartConfig}
				>
					<PieChart>
						<Pie
							data={chartData}
							dataKey="share"
							nameKey="channel"
							innerRadius={46}
							outerRadius={74}
							strokeWidth={2}
							stroke="var(--background)"
						>
							<LabelList
								className="fill-foreground font-mono text-[11px] font-bold"
								dataKey="share"
								formatter={(value: any) => `${value}%`}
								position="inside"
								stroke="none"
							/>
						</Pie>
						<ChartLegend
							className="mt-3 flex-wrap gap-2 text-xs"
							content={<ChartLegendContent nameKey="channel" />}
						/>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
