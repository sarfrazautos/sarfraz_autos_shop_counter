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
	MessageCircle,
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

	const handleDirectWhatsApp = (order: OrderRecord) => {
		let rawPhone = (order.customerPhone || "").replace(/[^0-9]/g, "");
		if (rawPhone.startsWith("0")) rawPhone = "92" + rawPhone.slice(1);

		const msg =
			`*SARFRAZ AUTOS (SHAHMIR) — ORDER ${order.invoiceNumber}*\n` +
			`Customer: ${order.customerName} (${order.customerCity})\n` +
			`Total Bill: Rs. ${order.netBill.toLocaleString()}\n` +
			`Cash Paid: Rs. ${order.cashReceived.toLocaleString()}\n` +
			`Balance: Rs. ${order.finalBalance.toLocaleString()}\n` +
			`_Thank you for your business!_`;

		window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`, "_blank");
	};

	return (
		<div className="w-full min-w-0 max-w-full rounded-xl border bg-card shadow-2xs overflow-hidden">
			<div className="overflow-x-auto">
				<Table className="w-full text-xs">
					<TableHeader>
						<TableRow className="border-b bg-muted/40 hover:bg-muted/40">
							<TableHead className="h-10 px-3 text-[11px] uppercase font-semibold text-foreground w-[100px]">
								Order ID
							</TableHead>
							<TableHead className="h-10 px-3 text-[11px] uppercase font-semibold text-foreground min-w-[130px]">
								Customer / Dealer
							</TableHead>
							<TableHead className="h-10 px-3 text-[11px] uppercase font-semibold text-foreground min-w-[180px]">
								Spare Parts Summary
							</TableHead>
							<TableHead className="h-10 px-2.5 text-center text-[11px] uppercase font-semibold text-foreground w-[60px]">
								Qty
							</TableHead>
							<TableHead className="h-10 px-2.5 text-center text-[11px] uppercase font-semibold text-foreground w-[90px]">
								Type
							</TableHead>
							<TableHead className="h-10 px-3 text-right text-[11px] uppercase font-semibold text-foreground w-[110px]">
								Net Amount
							</TableHead>
							<TableHead className="h-10 px-2.5 text-center text-[11px] uppercase font-semibold text-foreground w-[110px]">
								Status
							</TableHead>
							<TableHead className="h-10 px-3 text-[11px] uppercase font-semibold text-foreground w-[95px]">
								Date
							</TableHead>
							<TableHead className="h-10 px-3 text-right text-[11px] uppercase font-semibold text-foreground w-[140px]">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{orders.length > 0 ? (
							orders.map((order) => {
								const primaryItem = order.items[0];
								const moreItemsCount = order.items.length > 1 ? order.items.length - 1 : 0;

								return (
									<TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
										{/* Order ID */}
										<TableCell className="py-2.5 px-3 font-bold text-xs text-foreground font-mono">
											{order.id}
										</TableCell>

										{/* Dealer / Customer */}
										<TableCell className="py-2.5 px-3">
											<div className="flex flex-col">
												<span className="font-semibold text-xs text-foreground truncate max-w-[130px]">
													{order.customerName}
												</span>
												<span className="text-[10px] text-muted-foreground truncate max-w-[130px]">
													{order.customerCity}
												</span>
											</div>
										</TableCell>

										{/* Products with individual quantities badges */}
										<TableCell className="py-2.5 px-3">
											<div className="flex items-center gap-1.5 flex-wrap">
												{primaryItem && (
													<span className="text-xs text-foreground font-medium truncate max-w-[180px]" title={primaryItem.name}>
														{primaryItem.name}
													</span>
												)}
												{moreItemsCount > 0 && (
													<Badge variant="outline" className="text-[9px] py-0 px-1 font-mono text-muted-foreground">
														+{moreItemsCount} more
													</Badge>
												)}
											</div>
										</TableCell>

										{/* Total Quantity */}
										<TableCell className="py-2.5 px-2.5 text-center">
											<span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-muted/70 text-foreground font-mono font-semibold text-xs">
												{order.totalQuantity}
											</span>
										</TableCell>

										{/* Type */}
										<TableCell className="py-2.5 px-2.5 text-center">
											{getTypeBadge(order.type)}
										</TableCell>

										{/* Amount */}
										<TableCell className="py-2.5 px-3 text-right">
											<span className="font-bold font-mono text-xs text-foreground">
												Rs. {order.totalAmount.toLocaleString()}
											</span>
										</TableCell>

										{/* Status */}
										<TableCell className="py-2.5 px-2.5 text-center">
											{getStatusBadge(order.status)}
										</TableCell>

										{/* Date */}
										<TableCell className="py-2.5 px-3 text-[11px] font-mono text-muted-foreground whitespace-nowrap">
											{order.date}
										</TableCell>

										{/* Actions: Invoice button + WhatsApp + Delete */}
										<TableCell className="py-2.5 px-3">
											<div className="flex items-center justify-end gap-1.5">
												{/* WhatsApp Share Button */}
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	aria-label="WhatsApp Bill"
																	size="icon"
																	variant="outline"
																	onClick={() => handleDirectWhatsApp(order)}
																	className="size-7 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 cursor-pointer"
																/>
															}
														>
															<MessageCircle className="size-3.5" />
														</TooltipTrigger>
														<TooltipContent className="text-xs">Send on WhatsApp</TooltipContent>
													</Tooltip>
												</TooltipProvider>

												{/* Printable Invoice Button */}
												<Button
													size="xs"
													variant="outline"
													onClick={() => onViewInvoice(order)}
													className="h-7 px-2 gap-1 rounded-md border-neutral-300 hover:border-primary text-[11px] font-medium text-foreground hover:text-primary cursor-pointer shadow-2xs"
												>
													<Printer className="size-3 text-primary" />
													<span>Bill</span>
												</Button>

												{/* Delete Order Button */}
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger
															render={
																<Button
																	aria-label="Delete Order"
																	size="icon"
																	variant="ghost"
																	className="size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
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
								<TableCell colSpan={9} className="h-28 text-center text-muted-foreground text-xs">
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

