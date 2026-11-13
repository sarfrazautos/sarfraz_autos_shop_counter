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

type Stat = {
	label: string;
	value: string;
	footnote: string;
	icon: React.ReactNode;
};

const stats: readonly Stat[] = [
	{
		label: "Total Sales (This Month)",
		value: "Rs. 4,850,200",
		footnote: "vs last month (Rs. 4,120,000)",
		icon: <Banknote className="size-4 text-emerald-600" />,
	},
	{
		label: "Total Orders Completed",
		value: "1,428 Orders",
		footnote: "vs last month (1,280 Orders)",
		icon: <ShoppingBag className="size-4 text-primary" />,
	},
	{
		label: "Spare Parts Dispatched",
		value: "18,450 Units",
		footnote: "vs last month (16,300 Units)",
		icon: <Boxes className="size-4 text-sky-600" />,
	},
	{
		label: "Active Inventory Stock",
		value: "3,840 Items",
		footnote: "Across 3 branches vs last month",
		icon: <Store className="size-4 text-purple-600" />,
	},
];

export function DashboardStats() {
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
