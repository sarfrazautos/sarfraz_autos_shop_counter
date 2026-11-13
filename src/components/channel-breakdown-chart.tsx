"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { Pie, PieChart, Cell } from "recharts";
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
import { PieChart as PieChartIcon } from "lucide-react";

type ChannelDatum = {
	name: string;
	share: number;
	color: string;
};

const chartData: ChannelDatum[] = [
	{ name: "Wholesale Dealers", share: 55, color: "#10b981" }, // Emerald
	{ name: "Retail Walk-in", share: 32, color: "#0284c7" },    // Sky Blue
	{ name: "Mechanics / Accounts", share: 13, color: "#f59e0b" }, // Amber
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
	return (
		<Card
			className={cn("flex flex-col shadow-none dark:ring-0 justify-between", className)}
			{...props}
		>
			<CardHeader className="space-y-1 pb-2">
				<CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
					<PieChartIcon className="size-4 text-primary" />
					Sales by Order Type
				</CardTitle>
				<CardDescription className="text-xs">
					Share of wholesale vs counter retail sales.
				</CardDescription>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col items-center justify-between gap-4 pt-2">
				{/* Perfectly Centered Donut Chart with clean tooltips and no clipped labels */}
				<div className="w-full flex items-center justify-center">
					<ChartContainer
						className="aspect-square w-full max-w-[170px] max-h-[170px]"
						config={chartConfig}
					>
						<PieChart>
							<ChartTooltip
								content={
									<ChartTooltipContent
										className="min-w-32 font-mono text-xs"
										formatter={(value) => [`${value}%`, "Share"]}
									/>
								}
							/>
							<Pie
								data={chartData}
								dataKey="share"
								nameKey="name"
								innerRadius={48}
								outerRadius={74}
								strokeWidth={3}
								stroke="var(--background)"
								cx="50%"
								cy="50%"
								paddingAngle={2}
							>
								{chartData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
							</Pie>
						</PieChart>
					</ChartContainer>
				</div>

				{/* Perfectly Aligned Clean Breakdown List */}
				<div className="w-full flex flex-col gap-2 pt-3 border-t border-border/60">
					{chartData.map((item) => (
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
