"use client";

import Link from "next/link";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Store, Building2, MapPin, Tag, Bike, Layers, Calendar, DollarSign, PencilLine } from "lucide-react";
import type { ProductItem } from "./types";

interface ProductDetailDialogProps {
	product: ProductItem | null;
	isOpen: boolean;
	onClose: () => void;
}

export function ProductDetailDialog({ product, isOpen, onClose }: ProductDetailDialogProps) {
	if (!product) return null;

	const branchIcons = {
		main: <Store className="size-3.5 text-emerald-600" />,
		"branch-2": <Building2 className="size-3.5 text-sky-600" />,
		"branch-3": <MapPin className="size-3.5 text-amber-600" />,
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<span className="font-mono text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
							{product.sku}
						</span>
						<Badge
							variant="outline"
							className={`text-xs ${
								product.status === "In Stock"
									? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
									: product.status === "Low Stock"
									? "bg-amber-500/10 text-amber-600 border-amber-500/20"
									: "bg-rose-500/10 text-rose-600 border-rose-500/20"
							}`}
						>
							{product.status}
						</Badge>
						{product.type && (
							<Badge
								variant="outline"
								className={`text-xs ${
									product.type === "Wholesale"
										? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900"
										: product.type === "Retail"
										? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900"
										: "bg-muted text-muted-foreground"
								}`}
							>
								{product.type}
							</Badge>
						)}
					</div>
					<DialogTitle className="text-lg font-bold font-heading text-foreground pt-1">
						{product.name}
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground">
						Complete spare part profile, pricing, and branch inventory distribution.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2 text-sm">
					{/* Specs Grid */}
					<div className="grid grid-cols-2 gap-2.5 text-xs">
						<div className="p-3 rounded-lg border bg-card space-y-1">
							<span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
								<Bike className="size-3.5" /> Bike Model
							</span>
							<p className="font-semibold text-foreground text-sm">{product.bikeModel}</p>
						</div>

						<div className="p-3 rounded-lg border bg-card space-y-1">
							<span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
								<Tag className="size-3.5" /> Category
							</span>
							<p className="font-semibold text-foreground text-sm">{product.category}</p>
						</div>

						<div className="p-3 rounded-lg border bg-card space-y-1">
							<span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
								<DollarSign className="size-3.5" /> Counter Sale Price
							</span>
							<p className="font-bold text-foreground text-sm font-mono">
								Rs. {product.price.toLocaleString()}
							</p>
							<span className="text-[10px] text-muted-foreground">Cost: Rs. {product.costPrice}</span>
						</div>

						<div className="p-3 rounded-lg border bg-card space-y-1">
							<span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
								<Layers className="size-3.5" /> Total Quantity
							</span>
							<p className="font-bold text-foreground text-sm font-mono">
								{product.totalStock} {product.unit}
							</p>
							<span className="text-[10px] text-muted-foreground">Threshold: {product.lowStockThreshold}</span>
						</div>
					</div>

					{/* Branch Breakdown Section */}
					<div className="space-y-2 pt-1">
						<p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
							<Store className="size-3.5 text-primary" /> Branch Stock Availability
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
							{product.branches.map((b) => (
								<div key={b.branchId} className="p-2.5 rounded-lg border bg-muted/40 flex flex-col justify-between">
									<div className="flex items-center gap-1.5">
										{branchIcons[b.branchId]}
										<span className="text-[11px] font-medium text-foreground truncate">{b.branchName.split(" ")[0]} {b.branchName.split(" ")[1]}</span>
									</div>
									<div className="mt-2 flex items-baseline justify-between">
										<span className="font-heading font-bold text-base text-foreground font-mono">{b.stock}</span>
										<span className="text-[10px] text-muted-foreground">{product.unit}</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<DialogFooter className="border-t pt-3 flex flex-row items-center justify-between">
					<span className="text-[11px] text-muted-foreground">
						Updated: {product.updatedAt}
					</span>
					<div className="flex items-center gap-2">
						<DialogClose render={<Button size="sm" variant="outline" className="cursor-pointer">Close</Button>} />
						<Button
							size="sm"
							className="cursor-pointer gap-1.5 text-xs"
							render={<Link href={`/dashboard/products/edit/${product.id}`} />}
							nativeButton={false}
						>
							<PencilLine className="size-3.5" />
							Update Product
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

