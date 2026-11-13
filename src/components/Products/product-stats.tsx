import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, Layers, DollarSign } from "lucide-react";
import type { ProductItem } from "./types";

interface ProductStatsProps {
	products: ProductItem[];
}

export function ProductStatsCards({ products }: ProductStatsProps) {
	const totalCount = products.length;
	const totalUnits = products.reduce((acc, p) => acc + p.totalStock, 0);
	const lowStockCount = products.filter((p) => p.status === "Low Stock" || p.status === "Out of Stock").length;
	const totalValue = products.reduce((acc, p) => acc + p.price * p.totalStock, 0);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{/* 1. Total Product SKUs */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-muted-foreground">Total Catalog Items</p>
						<div className="flex items-baseline gap-2 mt-1">
							<span className="font-heading text-2xl font-bold tracking-tight text-foreground">
								{totalCount}
							</span>
							<span className="text-[11px] text-muted-foreground font-medium">Active SKUs</span>
						</div>
					</div>
					<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
						<Package className="size-5" />
					</div>
				</CardContent>
			</Card>

			{/* 2. Total In-Stock Quantity */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-muted-foreground">Total Units In Stock</p>
						<div className="flex items-baseline gap-2 mt-1">
							<span className="font-heading text-2xl font-bold tracking-tight text-foreground">
								{totalUnits.toLocaleString()}
							</span>
							<span className="text-[11px] text-muted-foreground font-medium">Across 3 branches</span>
						</div>
					</div>
					<div className="flex size-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 shrink-0">
						<Layers className="size-5" />
					</div>
				</CardContent>
			</Card>

			{/* 3. Low Stock / Out of Stock */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-muted-foreground">Low / Reorder Alert</p>
						<div className="flex items-baseline gap-2 mt-1">
							<span className="font-heading text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
								{lowStockCount}
							</span>
							<span className="text-[11px] text-amber-600/80 font-medium">Needs PO</span>
						</div>
					</div>
					<div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
						<AlertTriangle className="size-5" />
					</div>
				</CardContent>
			</Card>

			{/* 4. Estimated Stock Worth */}
			<Card className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition-shadow">
				<CardContent className="p-0 flex items-center justify-between">
					<div>
						<p className="text-xs font-medium text-muted-foreground">Estimated Inventory Worth</p>
						<div className="flex items-baseline gap-2 mt-1">
							<span className="font-heading text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
								Rs. {(totalValue / 1000).toFixed(1)}k
							</span>
							<span className="text-[11px] text-muted-foreground font-medium">Retail val</span>
						</div>
					</div>
					<div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
						<DollarSign className="size-5" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

