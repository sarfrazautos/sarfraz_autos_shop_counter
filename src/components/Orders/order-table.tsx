"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
	Printer,
	Truck,
	RotateCw,
	Clock,
	Ban,
	RotateCcw,
	Trash2,
	Eye,
	CheckCircle2,
	Package,
} from "lucide-react";
import type { OrderRecord, OrderStatus } from "./types";

interface OrderTableProps {
	orders: OrderRecord[];
	onViewInvoice: (order: OrderRecord) => void;
	onStatusChange?: (orderId: string, status: OrderStatus) => void;
	onDeleteOrder?: (orderId: string) => void;
}

export function OrderTable({
	orders,
	onViewInvoice,
	onStatusChange,
	onDeleteOrder,
}: OrderTableProps) {
	const getStatusBadge = (status: OrderStatus) => {
		switch (status) {
			case "Completed":
				return (
					<Badge
						className="border-0 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium text-xs"
						variant="outline"
					>
						<CheckCircle2 className="size-3 mr-1" />
						Completed
					</Badge>
				);
			case "In-Progress":
				return (
					<Badge
						className="border-0 bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 font-medium text-xs"
						variant="outline"
					>
						<Clock className="size-3 mr-1" />
						In-Progress
					</Badge>
				);
			case "Pending":
				return (
					<Badge
						className="border-0 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 font-medium text-xs"
						variant="outline"
					>
						<Clock className="size-3 mr-1" />
						Pending
					</Badge>
				);
			case "Cancelled":
				return (
					<Badge
						className="border-0 bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 font-medium text-xs"
						variant="outline"
					>
						<Ban className="size-3 mr-1" />
						Cancelled
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	const getTypeBadge = (type: OrderRecord["type"]) => {
		switch (type) {
			case "Wholesale":
				return (
					<Badge
						variant="outline"
						className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 font-medium text-xs rounded-full px-2.5"
					>
						Wholesale
					</Badge>
				);
			case "Retail":
				return (
					<Badge
						variant="outline"
						className="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900 font-medium text-xs rounded-full px-2.5"
					>
						Retail
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="font-medium text-xs rounded-full px-2.5">
						Both
					</Badge>
				);
		}
	};

	return (
		<div className="w-full min-w-0 max-w-full rounded-xl border bg-card shadow-2xs overflow-hidden">
			<div className="overflow-x-auto">
				<Table className="min-w-[980px]">
					<TableHeader>
						<TableRow className="border-b bg-muted/40 hover:bg-muted/40">
							<TableHead className="h-12 px-4 text-xs uppercase font-semibold text-foreground w-[120px]">
								Order ID
							</TableHead>
							<TableHead className="h-12 px-4 text-xs uppercase font-semibold text-foreground min-w-[140px]">
								Dealer / Customer
							</TableHead>
							<TableHead className="h-12 px-4 text-xs uppercase font-semibold text-foreground min-w-[260px]">
								Product
							</TableHead>
							<TableHead className="h-12 px-3 text-center text-xs uppercase font-semibold text-foreground w-[80px]">
								Qty
							</TableHead>
							<TableHead className="h-12 px-3 text-center text-xs uppercase font-semibold text-foreground w-[110px]">
								Type
							</TableHead>
							<TableHead className="h-12 px-4 text-right text-xs uppercase font-semibold text-foreground w-[120px]">
								Amount
							</TableHead>
							<TableHead className="h-12 px-3 text-center text-xs uppercase font-semibold text-foreground w-[120px]">
								Status
							</TableHead>
							<TableHead className="h-12 px-4 text-xs uppercase font-semibold text-foreground w-[120px]">
								Date
							</TableHead>
							<TableHead className="h-12 px-4 text-right text-xs uppercase font-semibold text-foreground w-[150px]">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{orders.length > 0 ? (
							orders.map((order) => {
								const primaryItem = order.items[0];
								const secondaryItem = order.items[1];
								const moreItemsCount = order.items.length > 2 ? order.items.length - 2 : 0;

								return (
									<TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
										{/* Order ID */}
										<TableCell className="h-16 px-4 font-bold text-sm text-foreground font-mono">
											{order.id}
										</TableCell>

										{/* Dealer / Customer */}
										<TableCell className="h-16 px-4">
											<div className="flex flex-col">
												<span className="font-semibold text-sm text-foreground truncate max-w-[140px]">
													{order.customerName}
												</span>
												<span className="text-xs text-muted-foreground truncate max-w-[140px]">
													{order.customerCity}
												</span>
											</div>
										</TableCell>

										{/* Products with individual quantities badges */}
										<TableCell className="h-16 px-4">
											<div className="flex flex-col gap-1 py-1">
												{primaryItem && (
													<div className="flex items-center gap-2 max-w-[260px]">
														<span className="text-xs text-foreground font-medium truncate" title={primaryItem.name}>
															{primaryItem.name}
														</span>
														<span className="px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded bg-muted text-muted-foreground border shrink-0">
															x{primaryItem.quantity}
														</span>
													</div>
												)}
												{secondaryItem && (
													<div className="flex items-center gap-2 max-w-[260px]">
														<span className="text-xs text-foreground font-medium truncate" title={secondaryItem.name}>
															{secondaryItem.name}
														</span>
														<span className="px-1.5 py-0.2 text-[10px] font-mono font-semibold rounded bg-muted text-muted-foreground border shrink-0">
															x{secondaryItem.quantity}
														</span>
													</div>
												)}
												{moreItemsCount > 0 && (
													<span className="text-[11px] text-muted-foreground font-normal">
														+{moreItemsCount} more items
													</span>
												)}
											</div>
										</TableCell>

										{/* Total Quantity */}
										<TableCell className="h-16 px-3 text-center">
											<span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-muted/80 text-foreground font-mono font-semibold text-xs border border-border/50">
												{order.totalQuantity}
											</span>
										</TableCell>

										{/* Type */}
										<TableCell className="h-16 px-3 text-center">
											{getTypeBadge(order.type)}
										</TableCell>

										{/* Amount */}
										<TableCell className="h-16 px-4 text-right">
											<span className="font-bold font-mono text-sm text-foreground">
												Rs. {order.totalAmount.toLocaleString()}
											</span>
										</TableCell>

										{/* Status */}
										<TableCell className="h-16 px-3 text-center">
											{getStatusBadge(order.status)}
										</TableCell>

										{/* Date */}
										<TableCell className="h-16 px-4 text-xs font-mono text-muted-foreground">
											{order.date}
										</TableCell>

										{/* Actions: Invoice button + Delete icon only */}
										<TableCell className="h-16 px-4">
											<div className="flex items-center justify-end gap-2">
												{/* Printable Invoice Button */}
												<Button
													size="sm"
													variant="outline"
													onClick={() => onViewInvoice(order)}
													className="h-8 px-3 gap-1.5 rounded-full border-neutral-300 hover:border-primary text-xs font-medium text-foreground hover:text-primary cursor-pointer shadow-2xs"
												>
													<Printer className="size-3.5 text-primary" />
													<span>Invoice</span>
												</Button>

												{/* Delete Order Button */}
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	aria-label="Delete Order"
																	size="icon"
																	variant="outline"
																	className="size-8 rounded-full text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer"
																	onClick={() => onDeleteOrder?.(order.id)}
																/>
															}
														>
															<Trash2 className="size-3.5" />
														</TooltipTrigger>
														<TooltipContent className="text-xs">Delete Record</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>
										</TableCell>
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-sm">
									No orders match your current filters.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

