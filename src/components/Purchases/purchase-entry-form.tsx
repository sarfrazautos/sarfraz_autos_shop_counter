"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	ShoppingCart,
	FileSpreadsheet,
	Plus,
	Search,
	Trash2,
	Building2,
	Store,
	FileText,
	CheckCircle2,
	Loader2,
	Zap,
	Gift,
	Paperclip,
	ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExcelPurchaseImport } from "./excel-purchase-import";
import { LastPurchaseBadge } from "./last-purchase-badge";
import type { PurchaseItem } from "./types";
import type { VendorProfile } from "@/components/Vendors/types";
import type { ProductItem } from "@/components/Products/types";
import { BRANCHES, type BranchId } from "@/components/Counter/types";

export function PurchaseEntryForm() {
	const router = useRouter();

	// Tabs
	const [activeTab, setActiveTab] = useState<"excel" | "manual">("excel");

	// Vendors & Products
	const [vendors, setVendors] = useState<VendorProfile[]>([]);
	const [productsList, setProductsList] = useState<ProductItem[]>([]);
	const [isLoadingMeta, setIsLoadingMeta] = useState(true);

	// Manual Entry State
	const [selectedVendorId, setSelectedVendorId] = useState<string>("");
	const [billNumber, setBillNumber] = useState<string>("");
	const [branchId, setBranchId] = useState<BranchId>("main");
	const [paidAmount, setPaidAmount] = useState<number>(0);
	const [billAttachmentUrl, setBillAttachmentUrl] = useState<string | null>(null);
	const [remarks, setRemarks] = useState<string>("");

	// Cart lines for manual entry
	const [items, setItems] = useState<PurchaseItem[]>([]);
	const [productSearch, setProductSearch] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	// Load Vendors & Products
	useEffect(() => {
		const loadData = async () => {
			setIsLoadingMeta(true);
			try {
				const [vRes, pRes] = await Promise.all([
					fetch("/api/vendors?limit=100"),
					fetch("/api/products?limit=200"),
				]);
				const vData = await vRes.json();
				const pData = await pRes.json();

				if (vData.vendors) {
					setVendors(vData.vendors);
					if (vData.vendors.length > 0) {
						setSelectedVendorId(vData.vendors[0].id);
					}
				}
				if (pData.products) {
					setProductsList(pData.products);
				}
			} catch (err) {
				console.error("Failed to load metadata:", err);
			} finally {
				setIsLoadingMeta(false);
			}
		};
		loadData();
	}, []);

	// Filter products for quick search
	const filteredProducts = productSearch.trim()
		? productsList
				.filter(
					(p) =>
						p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
						p.sku.toLowerCase().includes(productSearch.toLowerCase())
				)
				.slice(0, 8)
		: [];

	const handleAddProductToCart = (prod: ProductItem) => {
		const cost = prod.costPrice ? Number(prod.costPrice) : Math.round(prod.price * 0.85);
		const newItem: PurchaseItem = {
			productId: prod.id,
			productName: prod.name,
			sku: prod.sku,
			bikeModel: prod.bikeModel,
			purchaseRate: cost,
			quantity: 10,
			freeQuantity: 1, // Default 10+1
			isNetScheme: false,
			schemeNote: "10+1 Free Scheme",
			lineTotal: cost * 10,
		};
		setItems((prev) => [newItem, ...prev]);
		setProductSearch("");
	};

	const handleUpdateItem = (index: number, field: keyof PurchaseItem, val: any) => {
		setItems((prev) => {
			const updated = [...prev];
			const current = { ...updated[index], [field]: val };
			if (field === "purchaseRate" || field === "quantity") {
				current.lineTotal = current.purchaseRate * current.quantity;
			}
			updated[index] = current;
			return updated;
		});
	};

	const toggleNetScheme = (index: number) => {
		setItems((prev) => {
			const updated = [...prev];
			const current = updated[index];
			const nextNet = !current.isNetScheme;
			const buyQty = current.quantity || 10;
			const freeQty = current.freeQuantity || 1;
			let newRate = current.purchaseRate;

			if (nextNet) {
				newRate = Math.round((current.purchaseRate * buyQty) / (buyQty + freeQty));
			}

			updated[index] = {
				...current,
				isNetScheme: nextNet,
				purchaseRate: newRate,
				freeQuantity: nextNet ? 0 : freeQty,
				lineTotal: newRate * current.quantity,
				schemeNote: nextNet ? "Net Scheme Rate" : freeQty > 0 ? `+${freeQty} Free` : undefined,
			};
			return updated;
		});
	};

	const handleRemoveItem = (index: number) => {
		setItems((prev) => prev.filter((_, i) => i !== index));
	};

	// Totals
	const totalBilledQty = items.reduce((sum, it) => sum + it.quantity, 0);
	const totalFreeQty = items.reduce((sum, it) => sum + it.freeQuantity, 0);
	const totalDelivered = totalBilledQty + totalFreeQty;
	const totalBillPKR = items.reduce((sum, it) => sum + it.lineTotal, 0);

	// Submit Manual Purchase
	const handleSubmitManualPurchase = async () => {
		if (items.length === 0) {
			setError("Please add at least one spare part.");
			return;
		}
		if (!selectedVendorId) {
			setError("Please select a vendor.");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		const vendor = vendors.find((v) => v.id === selectedVendorId);

		try {
			const res = await fetch("/api/purchases", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					vendorId: selectedVendorId,
					vendorName: vendor?.name || "Vendor",
					invoiceNumber: billNumber || `BILL-${Date.now().toString().slice(-5)}`,
					branchId,
					paidAmount: paidAmount || 0,
					billAttachmentUrl,
					remarks: remarks || "Manual purchase entry",
					items,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to record purchase bill");

			setSuccessMsg(
				`Purchase bill #${data.purchase.invoiceNumber} recorded successfully! Stock added to inventory.`
			);
			setItems([]);
			setTimeout(() => {
				router.push("/dashboard/purchases");
			}, 1200);
		} catch (err: any) {
			setError(err.message || "Failed to submit purchase");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Link href="/dashboard/purchases">
						<Button variant="ghost" size="icon" className="size-8 cursor-pointer">
							<ArrowLeft className="size-4" />
						</Button>
					</Link>
					<div>
						<h1 className="font-heading font-black text-xl text-foreground flex items-center gap-2">
							<ShoppingCart className="size-5 text-primary" />
							Enter Purchase Bill & Inward Stock
						</h1>
						<p className="text-xs text-muted-foreground mt-0.5">
							Record vendor invoices, upload factory spreadsheets, and automatically update warehouse inventory
						</p>
					</div>
				</div>

				{/* Tab Switcher */}
				<div className="flex items-center p-1 bg-muted rounded-xl border">
					<button
						type="button"
						onClick={() => setActiveTab("excel")}
						className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
							activeTab === "excel"
								? "bg-background text-foreground shadow-2xs"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<FileSpreadsheet className="size-3.5 text-emerald-600" />
						Upload Excel Bill
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("manual")}
						className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
							activeTab === "manual"
								? "bg-background text-foreground shadow-2xs"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<Plus className="size-3.5 text-primary" />
						Manual Item Entry
					</button>
				</div>
			</div>

			{/* TAB 1: EXCEL BILL UPLOAD */}
			{activeTab === "excel" && (
				<ExcelPurchaseImport
					vendors={vendors}
					onSuccess={() => {
						setTimeout(() => {
							router.push("/dashboard/purchases");
						}, 1200);
					}}
				/>
			)}

			{/* TAB 2: MANUAL ITEM ENTRY */}
			{activeTab === "manual" && (
				<div className="space-y-5 animate-in fade-in">
					{/* Status alerts */}
					{error && (
						<div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs">
							{error}
						</div>
					)}
					{successMsg && (
						<div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
							<CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
							<span>{successMsg}</span>
						</div>
					)}

					{/* Purchase Header Settings */}
					<div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
						<h3 className="font-heading font-bold text-sm text-foreground">
							Vendor & Invoice Information
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
							{/* Supplier */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
									<Building2 className="size-3 text-muted-foreground" />
									Supplier / Vendor *
								</label>
								<select
									value={selectedVendorId}
									onChange={(e) => setSelectedVendorId(e.target.value)}
									className="w-full h-9 px-2 rounded-lg border text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
								>
									{vendors.map((v) => (
										<option key={v.id} value={v.id}>
											{v.name} ({v.city})
										</option>
									))}
								</select>
							</div>

							{/* Bill Number */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
									<FileText className="size-3 text-muted-foreground" />
									Vendor Bill / Invoice #
								</label>
								<Input
									placeholder="e.g. CRW-9812"
									value={billNumber}
									onChange={(e) => setBillNumber(e.target.value)}
									className="h-9 text-xs font-mono"
								/>
							</div>

							{/* Receiving Branch */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
									<Store className="size-3 text-muted-foreground" />
									Receiving Branch *
								</label>
								<select
									value={branchId}
									onChange={(e) => setBranchId(e.target.value as BranchId)}
									className="w-full h-9 px-2 rounded-lg border text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
								>
									{BRANCHES.map((b) => (
										<option key={b.id} value={b.id}>
											{b.name}
										</option>
									))}
								</select>
							</div>

							{/* Immediate Payment */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-foreground">
									Amount Paid to Vendor (PKR)
								</label>
								<Input
									type="number"
									placeholder="0 (Unpaid on Credit)"
									value={paidAmount || ""}
									onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
									className="h-9 text-xs font-mono font-bold"
								/>
							</div>
						</div>
					</div>

					{/* Search Spare Part from Catalog */}
					<div className="rounded-2xl border bg-card p-5 shadow-xs space-y-3">
						<h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
							<Search className="size-4 text-primary" />
							Search & Add Spare Parts from Catalog
						</h3>
						<div className="relative">
							<Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
							<Input
								placeholder="Search product by name or SKU to add to purchase bill..."
								value={productSearch}
								onChange={(e) => setProductSearch(e.target.value)}
								className="pl-9 h-9 text-xs bg-background"
							/>
						</div>

						{/* Search Autocomplete */}
						{filteredProducts.length > 0 && (
							<div className="rounded-xl border bg-popover shadow-md divide-y divide-border overflow-hidden">
								{filteredProducts.map((p) => (
									<div
										key={p.id}
										className="p-2.5 hover:bg-muted/50 flex items-center justify-between gap-3 transition-colors cursor-pointer"
										onClick={() => handleAddProductToCart(p)}
									>
										<div>
											<span className="font-semibold text-xs text-foreground block">
												{p.name}
											</span>
											<div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
												<span>SKU: {p.sku}</span>
												<span>•</span>
												<span>Model: {p.bikeModel}</span>
												<span>•</span>
												<span>Retail: Rs. {p.price}</span>
											</div>
										</div>
										<Button size="xs" className="h-6 text-[10px] gap-1 cursor-pointer">
											<Plus className="size-2.5" />
											Add to Bill
										</Button>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Purchase Items Table */}
					<div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
						<div className="p-4 border-b bg-muted/20 flex items-center justify-between">
							<h3 className="font-heading font-bold text-sm text-foreground">
								Purchase Items ({items.length} items)
							</h3>
							<span className="text-[11px] text-muted-foreground">
								Billed Qty + Free Bonus will be added to warehouse stock
							</span>
						</div>

						{items.length === 0 ? (
							<div className="py-12 text-center text-xs text-muted-foreground space-y-1">
								<ShoppingCart className="size-8 mx-auto opacity-30" />
								<p className="font-medium">No items added to this bill yet.</p>
								<p className="text-[11px]">Use the search bar above to add spare parts.</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-xs text-left">
									<thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
										<tr>
											<th className="py-2 px-3 w-8">#</th>
											<th className="py-2 px-3 min-w-[220px]">Product & Past Price</th>
											<th className="py-2 px-3 w-28 text-right">Cost Rate</th>
											<th className="py-2 px-3 w-20 text-center">Billed Qty</th>
											<th className="py-2 px-3 w-20 text-center">Free Bonus</th>
											<th className="py-2 px-3 w-24 text-center">Net Scheme</th>
											<th className="py-2 px-3 w-28 text-right">Total (PKR)</th>
											<th className="py-2 px-2 w-8 text-center"></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{items.map((it, idx) => (
											<tr key={idx} className="hover:bg-muted/20">
												<td className="py-2.5 px-3 font-mono text-muted-foreground text-center">
													{idx + 1}
												</td>
												{/* Product Name & Last Purchase Reminder (Client Voice Request) */}
												<td className="py-2.5 px-3">
													<div className="font-semibold text-foreground text-xs">
														{it.productName}
													</div>
													<div className="flex items-center gap-2 mt-0.5">
														<span className="text-[10px] font-mono text-muted-foreground">
															{it.sku} • {it.bikeModel}
														</span>
														{it.productId && (
															<LastPurchaseBadge productId={it.productId} />
														)}
													</div>
												</td>
												{/* Rate Input */}
												<td className="py-2.5 px-3 text-right">
													<Input
														type="number"
														value={it.purchaseRate}
														onChange={(e) =>
															handleUpdateItem(
																idx,
																"purchaseRate",
																parseFloat(e.target.value) || 0
															)
														}
														className="h-7 text-xs font-mono font-bold text-right"
													/>
												</td>
												{/* Quantity */}
												<td className="py-2.5 px-3 text-center">
													<Input
														type="number"
														value={it.quantity}
														onChange={(e) =>
															handleUpdateItem(
																idx,
																"quantity",
																parseInt(e.target.value, 10) || 1
															)
														}
														className="h-7 text-xs font-mono text-center font-bold"
													/>
												</td>
												{/* Free Bonus */}
												<td className="py-2.5 px-3 text-center">
													<Input
														type="number"
														value={it.freeQuantity}
														onChange={(e) =>
															handleUpdateItem(
																idx,
																"freeQuantity",
																parseInt(e.target.value, 10) || 0
															)
														}
														disabled={it.isNetScheme}
														className="h-7 text-xs font-mono text-center disabled:opacity-50"
													/>
												</td>
												{/* Net Scheme Toggle */}
												<td className="py-2.5 px-3 text-center">
													<button
														type="button"
														onClick={() => toggleNetScheme(idx)}
														className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto ${
															it.isNetScheme
																? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-black shadow-2xs"
																: "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
														}`}
													>
														<Zap
															className={`size-2.5 ${
																it.isNetScheme ? "fill-amber-500 text-amber-500" : ""
															}`}
														/>
														{it.isNetScheme ? "Net Rate" : "Normal"}
													</button>
												</td>
												{/* Total */}
												<td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
													Rs. {it.lineTotal.toLocaleString()}
												</td>
												{/* Delete */}
												<td className="py-2.5 px-2 text-center">
													<button
														type="button"
														onClick={() => handleRemoveItem(idx)}
														className="text-muted-foreground hover:text-rose-600 cursor-pointer p-1"
													>
														<Trash2 className="size-3.5" />
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						{/* Footer Calculations */}
						{items.length > 0 && (
							<div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div className="flex items-center gap-4 text-xs flex-wrap">
									<div>
										<span className="text-muted-foreground block text-[11px]">
											Billed Qty:
										</span>
										<strong className="font-mono text-foreground text-sm">
											{totalBilledQty} units
										</strong>
									</div>
									<div>
										<span className="text-muted-foreground block text-[11px]">
											Free Bonus Units:
										</span>
										<strong className="font-mono text-emerald-600 text-sm">
											+{totalFreeQty} Free
										</strong>
									</div>
									<div>
										<span className="text-muted-foreground block text-[11px]">
											Total Stock Inward:
										</span>
										<strong className="font-mono text-foreground text-sm">
											{totalDelivered} pieces
										</strong>
									</div>
									<div className="border-l pl-4">
										<span className="text-muted-foreground block text-[11px]">
											Total Bill Value:
										</span>
										<strong className="font-mono font-black text-rose-600 dark:text-rose-400 text-base">
											Rs. {totalBillPKR.toLocaleString()}
										</strong>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setItems([])}
										className="text-xs cursor-pointer text-muted-foreground hover:text-rose-600"
									>
										Clear Items
									</Button>
									<Button
										type="button"
										size="sm"
										disabled={isSubmitting || items.length === 0}
										onClick={handleSubmitManualPurchase}
										className="text-xs font-bold gap-2 cursor-pointer bg-primary text-primary-foreground shadow-sm h-9 px-4"
									>
										{isSubmitting ? (
											<Loader2 className="size-4 animate-spin" />
										) : (
											<CheckCircle2 className="size-4" />
										)}
										Save Purchase Bill & Add to Stock
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
