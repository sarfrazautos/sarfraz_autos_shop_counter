"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ShoppingCart,
	Building2,
	Store,
	FileText,
	Eye,
	Paperclip,
	CheckCircle2,
	Clock,
	X,
	ExternalLink,
	Zap,
	Gift,
} from "lucide-react";
import type { PurchaseRecord } from "./types";

interface PurchaseTableProps {
	purchases: PurchaseRecord[];
	isLoading: boolean;
	onViewDetails: (purchase: PurchaseRecord) => void;
}

export function PurchaseTable({ purchases, isLoading, onViewDetails }: PurchaseTableProps) {
	if (isLoading) {
		return (
			<div className="py-20 text-center text-xs text-muted-foreground space-y-2">
				<div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p>Loading purchase records...</p>
			</div>
		);
	}

	if (purchases.length === 0) {
		return (
			<div className="py-16 text-center text-muted-foreground space-y-2">
				<ShoppingCart className="size-10 mx-auto opacity-30" />
				<p className="text-sm font-semibold text-foreground">No purchase bills found</p>
				<p className="text-xs">
					Upload an Excel bill or enter manual inward purchase to restock inventory.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-left text-xs">
				<thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
					<tr>
						<th className="py-2.5 px-3">Invoice / Bill #</th>
						<th className="py-2.5 px-3">Vendor / Supplier</th>
						<th className="py-2.5 px-3">Branch & Date</th>
						<th className="py-2.5 px-3 text-center">Items Received</th>
						<th className="py-2.5 px-3 text-right">Total Amount</th>
						<th className="py-2.5 px-3 text-center">Payment Status</th>
						<th className="py-2.5 px-3 text-right">Actions</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-border">
					{purchases.map((p) => {
						const isPaid = p.paymentStatus === "Paid";
						const isPartial = p.paymentStatus === "Partial";
						const itemsCount = p.items?.length || 0;
						const totalUnits = p.items?.reduce(
							(sum, it) => sum + it.quantity + (it.freeQuantity || 0),
							0
						) || 0;

						return (
							<tr key={p.id} className="hover:bg-muted/30 transition-colors">
								{/* Invoice # */}
								<td className="py-3 px-3">
									<div className="flex items-center gap-2">
										<FileText className="size-3.5 text-muted-foreground" />
										<span className="font-mono font-bold text-foreground text-xs">
											{p.invoiceNumber}
										</span>
									</div>
									<span className="font-mono text-[10px] text-muted-foreground block">
										{p.id}
									</span>
								</td>

								{/* Vendor */}
								<td className="py-3 px-3">
									<div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
										<Building2 className="size-3 text-muted-foreground" />
										<span>{p.vendorName}</span>
									</div>
									<span className="text-[10px] text-muted-foreground">
										ID: {p.vendorId}
									</span>
								</td>

								{/* Branch & Date */}
								<td className="py-3 px-3">
									<div className="flex items-center gap-1 text-xs text-foreground font-medium">
										<Store className="size-3 text-muted-foreground" />
										<span>{p.branchShortName || p.branchId}</span>
									</div>
									<span className="font-mono text-[10px] text-muted-foreground block">
										{new Date(p.purchaseDate).toLocaleDateString("en-GB", {
											day: "2-digit",
											month: "short",
											year: "numeric",
										})}
									</span>
								</td>

								{/* Items count & pieces */}
								<td className="py-3 px-3 text-center">
									<div className="inline-flex flex-col items-center">
										<span className="font-mono font-bold text-xs text-foreground">
											{itemsCount} lines
										</span>
										<span className="text-[10px] text-muted-foreground">
											({totalUnits} pcs total)
										</span>
									</div>
								</td>

								{/* Total Amount & Balance */}
								<td className="py-3 px-3 text-right">
									<div className="flex flex-col items-end">
										<span className="font-mono font-black text-xs text-foreground">
											Rs. {p.totalAmount.toLocaleString()}
										</span>
										{p.balanceDue > 0 && (
											<span className="text-[10px] font-mono text-rose-600 dark:text-rose-400">
												Due: Rs. {p.balanceDue.toLocaleString()}
											</span>
										)}
									</div>
								</td>

								{/* Payment Status */}
								<td className="py-3 px-3 text-center">
									<Badge
										variant="outline"
										className={`text-[10px] py-0 px-2 font-bold ${
											isPaid
												? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
												: isPartial
												? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
												: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
										}`}
									>
										{p.paymentStatus}
									</Badge>
								</td>

								{/* Action Buttons */}
								<td className="py-3 px-3 text-right">
									<div className="flex items-center justify-end gap-1.5">
										<Button
											type="button"
											variant="outline"
											size="xs"
											onClick={() => onViewDetails(p)}
											className="h-7 text-[11px] gap-1 cursor-pointer font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/40"
										>
											<Eye className="size-3" />
											View Bill
										</Button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
