"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	ShoppingCart,
	Plus,
	Search,
	DollarSign,
	Store,
	FileSpreadsheet,
	RefreshCw,
	X,
	ExternalLink,
	Paperclip,
	Zap,
	Gift,
	PackagePlus,
} from "lucide-react";
import Link from "next/link";
import { PurchaseTable } from "./purchase-table";
import type { PurchaseRecord } from "./types";
import { BRANCHES } from "@/components/Counter/types";

export function PurchasesView() {
	const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedBranch, setSelectedBranch] = useState("all");
	const [selectedStatus, setSelectedStatus] = useState("all");

	// Detail Modal
	const [activePurchase, setActivePurchase] = useState<PurchaseRecord | null>(null);

	const fetchPurchases = async () => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams();
			if (searchQuery) params.set("search", searchQuery);
			if (selectedBranch !== "all") params.set("branchId", selectedBranch);
			if (selectedStatus !== "all") params.set("status", selectedStatus);

			const res = await fetch(`/api/purchases?${params.toString()}`);
			const data = await res.json();
			if (data.purchases) {
				setPurchases(data.purchases);
			}
		} catch (err) {
			console.error("Failed to fetch purchases:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchPurchases();
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery, selectedBranch, selectedStatus]);

	const totalPurchaseAmount = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
	const totalDueBalance = purchases.reduce((sum, p) => sum + (p.balanceDue || 0), 0);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<ShoppingCart className="size-6 text-primary" />
						<h1 className="font-heading font-black text-xl text-foreground">
							Purchasing & Inward Stock
						</h1>
					</div>
					<p className="text-xs text-muted-foreground mt-0.5">
						Vendor bills, factory invoices, Excel stock imports, and supplier accounts
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Link href="/dashboard/vendors">
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
						>
							Manage Vendors
						</Button>
					</Link>
					<Link href="/dashboard/purchases/new">
						<Button
							size="sm"
							className="h-8 text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground shadow-xs"
						>
							<Plus className="size-3.5" />
							Enter Purchase Bill / Excel
						</Button>
					</Link>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{/* Total Purchases Recorded */}
				<div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-1">
					<div className="flex items-center justify-between text-muted-foreground">
						<span className="text-xs font-medium">Recorded Purchase Invoices</span>
						<ShoppingCart className="size-4 text-primary" />
					</div>
					<div className="font-mono font-black text-2xl text-foreground">
						{purchases.length}
					</div>
					<p className="text-[11px] text-muted-foreground">Bills in database</p>
				</div>

				{/* Total Purchase Spending */}
				<div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-1">
					<div className="flex items-center justify-between text-muted-foreground">
						<span className="text-xs font-medium">Total Purchases Value</span>
						<DollarSign className="size-4 text-emerald-500" />
					</div>
					<div className="font-mono font-black text-2xl text-emerald-600 dark:text-emerald-400">
						Rs. {totalPurchaseAmount.toLocaleString()}
					</div>
					<p className="text-[11px] text-muted-foreground">Cumulative inward inventory value</p>
				</div>

				{/* Total Due to Suppliers */}
				<div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-1">
					<div className="flex items-center justify-between text-muted-foreground">
						<span className="text-xs font-medium">Unpaid Balance to Vendors</span>
						<DollarSign className="size-4 text-rose-500" />
					</div>
					<div className="font-mono font-black text-2xl text-rose-600 dark:text-rose-400">
						Rs. {totalDueBalance.toLocaleString()}
					</div>
					<p className="text-[11px] text-muted-foreground">Pending payable against these bills</p>
				</div>
			</div>

			{/* Filters Bar */}
			<div className="rounded-2xl border bg-card p-3 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
				<div className="relative flex-1 min-w-[240px]">
					<Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
					<Input
						placeholder="Search by vendor name or bill / invoice number..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 h-9 text-xs bg-background"
					/>
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					{/* Branch Filter */}
					<select
						value={selectedBranch}
						onChange={(e) => setSelectedBranch(e.target.value)}
						className="h-9 px-2.5 rounded-lg border text-xs bg-background focus:outline-none"
					>
						<option value="all">All Branches</option>
						{BRANCHES.map((b) => (
							<option key={b.id} value={b.id}>
								{b.shortName}
							</option>
						))}
					</select>

					{/* Payment Status Filter */}
					<select
						value={selectedStatus}
						onChange={(e) => setSelectedStatus(e.target.value)}
						className="h-9 px-2.5 rounded-lg border text-xs bg-background focus:outline-none"
					>
						<option value="all">All Payment Status</option>
						<option value="Paid">Paid</option>
						<option value="Partial">Partial</option>
						<option value="Unpaid">Unpaid (Credit)</option>
					</select>

					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={fetchPurchases}
						className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1.5"
					>
						<RefreshCw className="size-3.5" />
						Refresh
					</Button>
				</div>
			</div>

			{/* Purchase Table Card */}
			<div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
				<PurchaseTable
					purchases={purchases}
					isLoading={isLoading}
					onViewDetails={(p) => setActivePurchase(p)}
				/>
			</div>

			{/* Purchase Bill Details Modal */}
			{activePurchase && (
				<div
					className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
					onClick={() => setActivePurchase(null)}
				>
					<div
						className="bg-card border rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Modal Header */}
						<div className="p-4 border-b flex items-center justify-between bg-muted/30">
							<div className="flex items-center gap-2.5">
								<div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
									<ShoppingCart className="size-4" />
								</div>
								<div>
									<h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
										<span>Purchase Bill #{activePurchase.invoiceNumber}</span>
										<Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold">
											{activePurchase.paymentStatus}
										</Badge>
									</h3>
									<p className="text-[11px] text-muted-foreground">
										Supplier: {activePurchase.vendorName} • Receiving Branch:{" "}
										{activePurchase.branchShortName || activePurchase.branchId}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setActivePurchase(null)}
								className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
							>
								<X className="size-4" />
							</button>
						</div>

						{/* Items List */}
						<div className="p-4 flex-1 overflow-y-auto space-y-4">
							<div className="rounded-xl border overflow-hidden">
								<table className="w-full text-xs text-left">
									<thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
										<tr>
											<th className="py-2 px-3">#</th>
											<th className="py-2 px-3">Product Name & SKU</th>
											<th className="py-2 px-3 text-right">Cost Rate</th>
											<th className="py-2 px-3 text-center">Billed Qty</th>
											<th className="py-2 px-3 text-center">Free Bonus</th>
											<th className="py-2 px-3 text-right">Line Total</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{(activePurchase.items || []).map((it, idx) => (
											<tr key={idx} className="hover:bg-muted/20">
												<td className="py-2 px-3 font-mono text-muted-foreground text-center">
													{idx + 1}
												</td>
												<td className="py-2 px-3">
													<span className="font-semibold text-foreground block">
														{it.productName}
													</span>
													<div className="flex items-center gap-1.5 mt-0.5">
														<span className="text-[10px] font-mono text-muted-foreground">
															{it.sku} • {it.bikeModel}
														</span>
														{it.isNetScheme && (
															<Badge className="text-[9px] py-0 px-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-0.5 font-bold">
																<Zap className="size-2 text-amber-500 fill-amber-500" />
																Net Scheme
															</Badge>
														)}
														{it.freeQuantity > 0 && (
															<Badge className="text-[9px] py-0 px-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 font-bold">
																<Gift className="size-2 text-emerald-600" />
																+{it.freeQuantity} Free
															</Badge>
														)}
													</div>
												</td>
												<td className="py-2 px-3 text-right font-mono font-semibold">
													Rs. {it.purchaseRate.toLocaleString()}
												</td>
												<td className="py-2 px-3 text-center font-mono font-bold">
													{it.quantity}
												</td>
												<td className="py-2 px-3 text-center font-mono text-emerald-600 font-bold">
													{it.freeQuantity > 0 ? `+${it.freeQuantity}` : "—"}
												</td>
												<td className="py-2 px-3 text-right font-mono font-bold text-foreground">
													Rs. {it.lineTotal.toLocaleString()}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							{/* Bill Remarks / Notes */}
							{activePurchase.remarks && (
								<div className="p-3 rounded-xl bg-muted/30 border text-xs text-muted-foreground space-y-1">
									<strong className="text-foreground">Remarks:</strong>
									<p>{activePurchase.remarks}</p>
								</div>
							)}

							{/* Bill Attachment Link */}
							{activePurchase.billAttachmentUrl && (
								<div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between text-xs">
									<div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-semibold">
										<Paperclip className="size-3.5" />
										<span>Vendor Original Paper Bill / Slip Attached</span>
									</div>
									<a
										href={activePurchase.billAttachmentUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
									>
										<span>View Attachment</span>
										<ExternalLink className="size-3" />
									</a>
								</div>
							)}
						</div>

						{/* Modal Footer Totals */}
						<div className="p-4 border-t bg-muted/20 flex items-center justify-between text-xs">
							<div>
								<span className="text-muted-foreground block text-[11px]">
									Total Bill Amount:
								</span>
								<strong className="font-mono font-black text-foreground text-sm">
									Rs. {activePurchase.totalAmount.toLocaleString()}
								</strong>
							</div>

							<div>
								<span className="text-muted-foreground block text-[11px]">Amount Paid:</span>
								<strong className="font-mono font-bold text-emerald-600 text-sm">
									Rs. {activePurchase.paidAmount.toLocaleString()}
								</strong>
							</div>

							<div>
								<span className="text-muted-foreground block text-[11px]">
									Balance Due (Khata):
								</span>
								<strong className="font-mono font-bold text-rose-600 text-sm">
									Rs. {activePurchase.balanceDue.toLocaleString()}
								</strong>
							</div>

							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setActivePurchase(null)}
								className="h-8 text-xs cursor-pointer"
							>
								Close
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
