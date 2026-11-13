"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Eye,
	Plus,
	Trash2,
	Store,
	Building2,
	MapPin,
	Bike,
	AlertCircle,
	CheckCircle2,
	PencilLine,
} from "lucide-react";
import type { ProductItem } from "./types";

interface ProductTableProps {
	products: ProductItem[];
	selectedIds: string[];
	onToggleSelectAll: () => void;
	onToggleSelectOne: (id: string) => void;
	onViewProduct: (product: ProductItem) => void;
	onAddStock: (product: ProductItem) => void;
	onDeleteProduct: (product: ProductItem) => void;
}

export function ProductTable({
	products,
	selectedIds,
	onToggleSelectAll,
	onToggleSelectOne,
	onViewProduct,
	onAddStock,
	onDeleteProduct,
}: ProductTableProps) {
	const allSelected = products.length > 0 && selectedIds.length === products.length;
	const someSelected = selectedIds.length > 0 && selectedIds.length < products.length;

	const getTypeBadge = (type?: ProductItem["type"]) => {
		switch (type) {
			case "Wholesale":
				return (
					<Badge
						variant="outline"
						className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 font-medium text-[11px] rounded-full px-2 py-0.2 whitespace-nowrap"
					>
						Wholesale
					</Badge>
				);
			case "Retail":
				return (
					<Badge
						variant="outline"
						className="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900 font-medium text-[11px] rounded-full px-2 py-0.2 whitespace-nowrap"
					>
						Retail
					</Badge>
				);
			default:
				return (
					<Badge
						variant="outline"
						className="bg-muted text-muted-foreground font-medium text-[11px] rounded-full px-2 py-0.2 whitespace-nowrap"
					>
						Both
					</Badge>
				);
		}
	};

	const getStatusBadge = (status: ProductItem["status"]) => {
		switch (status) {
			case "In Stock":
				return (
					<Badge
						className="border-0 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium text-xs whitespace-nowrap"
						variant="outline"
					>
						<CheckCircle2 className="size-3 mr-1" />
						In Stock
					</Badge>
				);
			case "Low Stock":
				return (
					<Badge
						className="border-0 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 font-medium text-xs whitespace-nowrap"
						variant="outline"
					>
						<AlertCircle className="size-3 mr-1" />
						Low Stock
					</Badge>
				);
			case "Out of Stock":
				return (
					<Badge
						className="border-0 bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 font-medium text-xs whitespace-nowrap"
						variant="outline"
					>
						Out of Stock
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	return (
		<div className="w-full min-w-0 max-w-full rounded-xl border bg-card shadow-2xs overflow-hidden">
			<div className="overflow-x-auto">
				<Table className="min-w-[980px]">
					<TableHeader>
						<TableRow className="border-b bg-muted/40 hover:bg-muted/40">
							{/* Checkbox Select All */}
							<TableHead className="h-12 w-[46px] px-4 text-center">
								<Checkbox
									checked={allSelected}
									indeterminate={someSelected}
									onCheckedChange={onToggleSelectAll}
									aria-label="Select all products"
									className="cursor-pointer"
								/>
							</TableHead>

							<TableHead className="h-12 px-4 text-xs uppercase font-semibold text-foreground min-w-[240px]">
								Product Name & SKU
							</TableHead>

							<TableHead className="h-12 px-3 text-xs uppercase font-semibold text-foreground min-w-[130px]">
								Category
							</TableHead>

							<TableHead className="h-12 px-3 text-center text-xs uppercase font-semibold text-foreground w-[95px]">
								Type
							</TableHead>

							<TableHead className="h-12 px-3 text-xs uppercase font-semibold text-foreground min-w-[130px]">
								Model / Bike
							</TableHead>

							<TableHead className="h-12 px-4 text-right text-xs uppercase font-semibold text-foreground w-[110px]">
								Price
							</TableHead>

							<TableHead className="h-12 px-3 text-center text-xs uppercase font-semibold text-foreground w-[110px]">
								Total Stock
							</TableHead>

							<TableHead className="h-12 px-3 text-xs uppercase font-semibold text-foreground min-w-[180px]">
								Branch Stock
							</TableHead>

							<TableHead className="h-12 px-3 text-center text-xs uppercase font-semibold text-foreground w-[110px]">
								Status
							</TableHead>

							<TableHead className="h-12 px-4 text-right text-xs uppercase font-semibold text-foreground w-[160px]">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{products.length > 0 ? (
							products.map((product) => {
								const isSelected = selectedIds.includes(product.id);
								const saddarStock = product.branches.find((b) => b.branchId === "main")?.stock ?? 0;
								const gulshanStock = product.branches.find((b) => b.branchId === "branch-2")?.stock ?? 0;
								const dhaStock = product.branches.find((b) => b.branchId === "branch-3")?.stock ?? 0;

								return (
									<TableRow
										key={product.id}
										className={`hover:bg-muted/50 transition-colors ${
											isSelected ? "bg-primary/[0.03]" : ""
										}`}
									>
										{/* Checkbox Single */}
										<TableCell className="h-16 px-4 text-center">
											<Checkbox
												checked={isSelected}
												onCheckedChange={() => onToggleSelectOne(product.id)}
												aria-label={`Select ${product.name}`}
												className="cursor-pointer"
											/>
										</TableCell>

										{/* Product Name & SKU */}
										<TableCell className="h-16 px-4">
											<div className="flex flex-col">
												<span className="font-semibold text-sm text-foreground truncate max-w-[260px]" title={product.name}>
													{product.name}
												</span>
												<div className="flex items-center gap-2 mt-0.5">
													<span className="text-[11px] font-mono text-muted-foreground">
														{product.sku}
													</span>
												</div>
											</div>
										</TableCell>

										{/* Category */}
										<TableCell className="h-16 px-3">
											<span className="text-xs text-muted-foreground font-medium block truncate max-w-[130px]">
												{product.category}
											</span>
										</TableCell>

										{/* Product Type (Wholesale / Retail / Both) */}
										<TableCell className="h-16 px-3 text-center">
											{getTypeBadge(product.type)}
										</TableCell>

										{/* Bike Model */}
										<TableCell className="h-16 px-3">
											<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 text-foreground border border-border/50 text-xs">
												<Bike className="size-3 text-muted-foreground shrink-0" />
												<span className="truncate max-w-[120px] font-medium">{product.bikeModel}</span>
											</div>
										</TableCell>

										{/* Price */}
										<TableCell className="h-16 px-4 text-right">
											<span className="font-bold font-mono text-sm text-foreground">
												Rs. {product.price.toLocaleString()}
											</span>
										</TableCell>

										{/* Total Stock */}
										<TableCell className="h-16 px-3 text-center">
											<div className="flex flex-col items-center">
												<span
													className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
														product.totalStock === 0
															? "bg-rose-500/10 text-rose-600"
															: product.totalStock <= product.lowStockThreshold
															? "bg-amber-500/10 text-amber-600"
															: "bg-muted text-foreground"
													}`}
												>
													{product.totalStock}
												</span>
											</div>
										</TableCell>

										{/* Branch Stock Breakdown Pills */}
										<TableCell className="h-16 px-3">
											<div className="flex items-center gap-1.5 text-[11px] font-mono">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger render={<span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 cursor-default" />}>
															S: {saddarStock}
														</TooltipTrigger>
														<TooltipContent className="text-xs">Saddar Main Workshop: {saddarStock}</TooltipContent>
													</Tooltip>

													<Tooltip>
														<TooltipTrigger render={<span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 cursor-default" />}>
															G: {gulshanStock}
														</TooltipTrigger>
														<TooltipContent className="text-xs">Gulshan Auto Hub: {gulshanStock}</TooltipContent>
													</Tooltip>

													<Tooltip>
														<TooltipTrigger render={<span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 cursor-default" />}>
															D: {dhaStock}
														</TooltipTrigger>
														<TooltipContent className="text-xs">DHA Express Counter: {dhaStock}</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>
										</TableCell>

										{/* Status */}
										<TableCell className="h-16 px-3 text-center">
											{getStatusBadge(product.status)}
										</TableCell>

										{/* 3 Actions: View, Add Stock, Delete */}
										<TableCell className="h-16 px-4 text-right">
											<TooltipProvider>
												<div className="flex items-center justify-end gap-1.5">
													{/* 1. View Icon */}
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	aria-label="View Product Details"
																	size="icon"
																	variant="outline"
																	className="size-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
																	onClick={() => onViewProduct(product)}
																/>
															}
														>
															<Eye className="size-3.5" />
														</TooltipTrigger>
														<TooltipContent className="text-xs">View Product Details</TooltipContent>
													</Tooltip>

													{/* 2. Add Stock Icon */}
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	aria-label="Add Stock"
																	size="icon"
																	variant="outline"
																	className="size-8 rounded-full text-muted-foreground hover:text-primary hover:border-primary/40 cursor-pointer"
																	onClick={() => onAddStock(product)}
																/>
															}
														>
															<Plus className="size-3.5 text-primary" />
														</TooltipTrigger>
														<TooltipContent className="text-xs">Add Inventory Stock</TooltipContent>
													</Tooltip>

													{/* 3. Update / Edit Product Icon */}
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	aria-label="Update Product"
																	size="icon"
																	variant="outline"
																	className="size-8 rounded-full text-muted-foreground hover:text-sky-600 hover:border-sky-300 dark:hover:text-sky-400 cursor-pointer"
																	render={<Link href={`/dashboard/products/edit/${product.id}`} />}
																	nativeButton={false}
																/>
															}
														>
															<PencilLine className="size-3.5 text-sky-600 dark:text-sky-400" />
														</TooltipTrigger>
														<TooltipContent className="text-xs">Update Product</TooltipContent>
													</Tooltip>

													{/* 4. Delete Icon */}
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	aria-label="Delete Product"
																	size="icon"
																	variant="outline"
																	className="size-8 rounded-full text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer"
																	onClick={() => onDeleteProduct(product)}
																/>
															}
														>
															<Trash2 className="size-3.5" />
														</TooltipTrigger>
														<TooltipContent className="text-xs">Delete Product</TooltipContent>
													</Tooltip>
												</div>
											</TooltipProvider>
										</TableCell>
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-sm">
									No products match the selected criteria or search.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
