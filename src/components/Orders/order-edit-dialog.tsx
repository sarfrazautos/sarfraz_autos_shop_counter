"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Pencil,
	User,
	Phone,
	MapPin,
	CreditCard,
	Banknote,
	Truck,
	CheckCircle2,
	Clock,
	Ban,
	Trash2,
	ExternalLink,
	Loader2,
	AlertTriangle,
	Package,
	Store,
	FileText,
	Receipt,
	Landmark,
	Plus,
	Search,
	Eye,
	Paperclip,
	Upload,
	X,
	Smartphone,
} from "lucide-react";
import { updateOrder } from "@/lib/api/orders/orders-api";
import { fetchBankAccounts, type BankAccountItem } from "@/lib/api/bank-accounts/bank-accounts-api";
import { fetchProducts, type ProductItem } from "@/lib/api/products/products-api";
import type { OrderRecord, OrderStatus, OrderType } from "./types";

interface OrderEditDialogProps {
	order: OrderRecord | null;
	isOpen: boolean;
	onClose: () => void;
	onOrderUpdated?: () => void;
}

interface EditableOrderItem {
	id?: string;
	productId?: string;
	name: string;
	subLabel?: string;
	bikeModel?: string;
	category?: string;
	quantity: number;
	rate: number;
	total: number;
}

export function OrderEditDialog({
	order,
	isOpen,
	onClose,
	onOrderUpdated,
}: OrderEditDialogProps) {
	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [customerCity, setCustomerCity] = useState("Karachi");
	const [orderType, setOrderType] = useState<OrderType>("Wholesale");
	const [orderStatus, setOrderStatus] = useState<OrderStatus>("Completed");
	const [paymentMethod, setPaymentMethod] = useState("Cash on Counter");
	const [items, setItems] = useState<EditableOrderItem[]>([]);
	const [discountMode, setDiscountMode] = useState<"fixed" | "percent">("fixed");
	const [discountInput, setDiscountInput] = useState<string>("0");
	const [shippingCharges, setShippingCharges] = useState(0);
	const [cashReceived, setCashReceived] = useState(0);
	const [onlineReceived, setOnlineReceived] = useState(0);
	const [remarks, setRemarks] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

	// WhatsApp Slip State
	const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
	const [isUploadingSlip, setIsUploadingSlip] = useState(false);
	const [previewSlipModalOpen, setPreviewSlipModalOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	// Bank Accounts State
	const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
	const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | null>(null);
	const [selectedBankAccountName, setSelectedBankAccountName] = useState<string | null>(null);

	// Product Search for adding missing spare parts
	const [productSearchQuery, setProductSearchQuery] = useState("");
	const [isSearchingProducts, setIsSearchingProducts] = useState(false);
	const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	// Load active bank accounts
	useEffect(() => {
		fetchBankAccounts(true)
			.then((res) => {
				if (res.success && Array.isArray(res.data)) {
					setBankAccounts(res.data);
				}
			})
			.catch(console.error);
	}, []);

	// Synchronize state when order changes
	useEffect(() => {
		if (order) {
			setCustomerName(order.customerName || "");
			setCustomerPhone(order.customerPhone === "N/A" ? "" : order.customerPhone || "");
			setCustomerCity(order.customerCity || "Karachi");
			setOrderType(order.type || "Wholesale");
			setOrderStatus(order.status || "Completed");
			setPaymentMethod(order.paymentMethod || "Cash on Counter");
			const initialDiscount = Number(order.discountAmount) || 0;
			setDiscountMode("fixed");
			setDiscountInput(initialDiscount > 0 ? String(initialDiscount) : "0");
			setShippingCharges(Number(order.shippingCharges) || 0);
			setCashReceived(Number(order.cashReceived) || 0);
			setOnlineReceived(Number(order.onlineReceived) || 0);
			setRemarks(order.remarks || "");
			setPaymentSlipUrl(order.paymentProofUrl || null);
			setSelectedBankAccountId(order.bankAccountId || null);
			setSelectedBankAccountName(order.bankAccountName || null);
			setFeedbackMsg(null);
			setProductSearchQuery("");
			setIsSearchOpen(false);

			if (Array.isArray(order.items) && order.items.length > 0) {
				setItems(
					order.items.map((it: any) => ({
						id: it.id,
						productId: it.productId,
						name: it.name || "Item",
						subLabel: it.subLabel || "",
						quantity: Number(it.quantity) || 1,
						rate: Number(it.rate) || 0,
						total: Number(it.total) || Number(it.quantity) * Number(it.rate),
					}))
				);
			} else {
				setItems([]);
			}
		}
	}, [order]);

	// Auto-calculated totals
	const subtotal = useMemo(() => {
		return items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
	}, [items]);

	const discountAmount = useMemo(() => {
		const raw = parseFloat(discountInput.replace(/[^0-9.]/g, "")) || 0;
		if (discountMode === "percent") {
			return Math.min(subtotal, Math.round((subtotal * Math.max(0, raw)) / 100));
		}
		return Math.min(subtotal, Math.max(0, raw));
	}, [subtotal, discountMode, discountInput]);

	const handleSwitchToPercent = () => {
		if (discountMode === "percent") return;
		setDiscountMode("percent");
		const cur = parseFloat(discountInput) || 0;
		if (subtotal > 0 && cur > 0 && cur <= subtotal) {
			const pct = ((cur / subtotal) * 100).toFixed(1).replace(/\.0$/, "");
			setDiscountInput(pct);
		}
	};

	const handleSwitchToFixed = () => {
		if (discountMode === "fixed") return;
		setDiscountMode("fixed");
		setDiscountInput(String(discountAmount));
	};

	const handleDiscountInputChange = (val: string) => {
		if (val.includes("%")) {
			setDiscountMode("percent");
			setDiscountInput(val.replace(/%/g, "").trim());
		} else {
			setDiscountInput(val);
		}
	};

	const netBill = useMemo(() => {
		return Math.max(0, subtotal - discountAmount + shippingCharges);
	}, [subtotal, discountAmount, shippingCharges]);

	const totalReceived = useMemo(() => {
		if (paymentMethod === "Online Transfer") return onlineReceived;
		if (paymentMethod.includes("Split")) return cashReceived + onlineReceived;
		if (paymentMethod.includes("Credit")) return 0;
		return cashReceived;
	}, [paymentMethod, cashReceived, onlineReceived]);

	const balanceDue = useMemo(() => {
		return Math.max(0, netBill - totalReceived);
	}, [netBill, totalReceived]);

	const handleItemChange = (index: number, field: "quantity" | "rate", val: number) => {
		setItems((prev) => {
			const updated = [...prev];
			const cur = updated[index];
			const nextQty = field === "quantity" ? Math.max(1, val) : cur.quantity;
			const nextRate = field === "rate" ? Math.max(0, val) : cur.rate;
			updated[index] = {
				...cur,
				quantity: nextQty,
				rate: nextRate,
				total: nextQty * nextRate,
			};
			return updated;
		});
	};

	const handleRemoveItem = (index: number) => {
		if (items.length <= 1) {
			alert("An order must have at least one product item.");
			return;
		}
		setItems((prev) => prev.filter((_, i) => i !== index));
	};

	// Debounced product search for adding new spare parts
	useEffect(() => {
		if (!productSearchQuery.trim()) {
			setSearchResults([]);
			setIsSearchOpen(false);
			return;
		}

		const timer = setTimeout(async () => {
			try {
				setIsSearchingProducts(true);
				const res = await fetchProducts({
					search: productSearchQuery.trim(),
					limit: 8,
				});
				if (res?.data && Array.isArray(res.data)) {
					setSearchResults(res.data);
					setIsSearchOpen(true);
				}
			} catch (err) {
				console.error("Product search failed in edit dialog:", err);
			} finally {
				setIsSearchingProducts(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [productSearchQuery]);

	// Add product to items list
	const handleAddProduct = (prod: ProductItem) => {
		const rate = orderType.includes("Wholesale") ? prod.price : (prod.retailPrice || prod.price);
		setItems((prev) => [
			...prev,
			{
				productId: prod.id,
				name: prod.name,
				subLabel: `${prod.bikeModel || "Universal"} | ${prod.category || "Spare Parts"}`,
				bikeModel: prod.bikeModel,
				category: prod.category,
				quantity: 1,
				rate: rate || prod.price || 0,
				total: rate || prod.price || 0,
			},
		]);
		setProductSearchQuery("");
		setIsSearchOpen(false);
	};

	// Upload WhatsApp slip image to Vercel Blob
	const handleUploadSlipFile = async (file: File) => {
		if (!file.type.startsWith("image/")) {
			alert("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
			return;
		}

		setIsUploadingSlip(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("folder", "payment-slips");

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();
			if (data.url) {
				setPaymentSlipUrl(data.url);
			} else {
				throw new Error(data.error || "Upload failed");
			}
		} catch (err: any) {
			console.error("Slip upload error:", err);
			alert(err.message || "Failed to upload payment slip");
		} finally {
			setIsUploadingSlip(false);
		}
	};

	// Global Clipboard Paste listener (Ctrl+V) from WhatsApp Web
	useEffect(() => {
		if (!isOpen || paymentMethod === "Cash on Counter") return;

		const handlePaste = (e: ClipboardEvent) => {
			const clipboardItems = e.clipboardData?.items;
			if (!clipboardItems) return;

			for (let i = 0; i < clipboardItems.length; i++) {
				if (clipboardItems[i].type.startsWith("image/")) {
					const blob = clipboardItems[i].getAsFile();
					if (blob) {
						const file = new File(
							[blob],
							`whatsapp-slip-${Date.now()}.${blob.type.split("/")[1] || "jpg"}`,
							{ type: blob.type }
						);
						handleUploadSlipFile(file);
						break;
					}
				}
			}
		};

		window.addEventListener("paste", handlePaste);
		return () => window.removeEventListener("paste", handlePaste);
	}, [isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!order) return;

		setIsSubmitting(true);
		setFeedbackMsg(null);

		try {
			await updateOrder(order.id, {
				customerName: customerName.trim() || "Walk-in Retail Customer",
				customerPhone: customerPhone.trim(),
				customerCity: customerCity.trim() || "Karachi",
				orderType,
				orderStatus,
				paymentMethod,
				paymentProofUrl: paymentSlipUrl || null,
				bankAccountId: (paymentMethod === "Online Transfer" || paymentMethod.includes("Split")) ? selectedBankAccountId : null,
				bankAccountName: (paymentMethod === "Online Transfer" || paymentMethod.includes("Split")) ? selectedBankAccountName : null,
				subtotalAmount: subtotal,
				discountAmount,
				shippingCharges,
				totalAmount: netBill,
				cashReceived,
				onlineReceived,
				changeReturned: totalReceived > netBill ? totalReceived - netBill : 0,
				netBalanceAdded: balanceDue,
				remarks: remarks.trim(),
				items: items.map((it) => ({
					id: it.id,
					productId: it.productId,
					name: it.name,
					bikeModel: it.bikeModel,
					category: it.category,
					quantity: it.quantity,
					rate: it.rate,
					lineTotal: it.quantity * it.rate,
				})),
			});

			setFeedbackMsg({ type: "success", text: "Order details and payment slip updated successfully!" });
			onOrderUpdated?.();
			setTimeout(() => {
				onClose();
			}, 900);
		} catch (err: any) {
			console.error("Order update failed:", err);
			setFeedbackMsg({ type: "error", text: err.message || "Failed to update order" });
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!order) return null;

	return (
		<>
			<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<DialogContent className="w-[96vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
								<Pencil className="size-5 text-primary" />
								Edit Invoice #{order.invoiceNumber}
							</DialogTitle>
							<Badge variant="outline" className="font-mono text-xs">
								{order.dateTimeFull}
							</Badge>
						</div>
						<DialogDescription className="text-xs text-muted-foreground">
							Modify customer information, items, pricing, payment channels, receiving bank account, or attach WhatsApp payment slip.
						</DialogDescription>
					</DialogHeader>

					{feedbackMsg && (
						<div
							className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
								feedbackMsg.type === "success"
									? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
									: "bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-300"
							}`}
						>
							{feedbackMsg.type === "success" ? (
								<CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
							) : (
								<AlertTriangle className="size-4 shrink-0 text-rose-600" />
							)}
							<span>{feedbackMsg.text}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* 1. CUSTOMER INFORMATION */}
						<div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
							<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
								<User className="size-4 text-primary" />
								Customer Information
							</h4>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-semibold text-muted-foreground">Customer Name:</label>
									<Input
										value={customerName}
										onChange={(e) => setCustomerName(e.target.value)}
										placeholder="e.g. Afraz Auto Works"
										className="h-8 text-xs font-medium"
										required
									/>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-semibold text-muted-foreground">Phone Number:</label>
									<Input
										value={customerPhone}
										onChange={(e) => setCustomerPhone(e.target.value)}
										placeholder="e.g. 0300-1234567"
										className="h-8 text-xs font-mono"
									/>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-semibold text-muted-foreground">City:</label>
									<Input
										value={customerCity}
										onChange={(e) => setCustomerCity(e.target.value)}
										placeholder="Karachi"
										className="h-8 text-xs"
									/>
								</div>
							</div>
						</div>

						{/* 2. ORDER TYPE & STATUS */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="rounded-xl border bg-card p-3.5 shadow-xs space-y-1.5">
								<label className="text-xs font-semibold text-muted-foreground">Pricing Tier:</label>
								<Select value={orderType} onValueChange={(val) => setOrderType(val as OrderType)}>
									<SelectTrigger className="h-8 text-xs font-bold w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="min-w-[240px]">
										<SelectItem value="Wholesale">Wholesale Dealer Rate</SelectItem>
										<SelectItem value="Retail">Retail Walk-in Rate</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="rounded-xl border bg-card p-3.5 shadow-xs space-y-1.5">
								<label className="text-xs font-semibold text-muted-foreground">Order Status:</label>
								<Select value={orderStatus} onValueChange={(val) => setOrderStatus(val as OrderStatus)}>
									<SelectTrigger className="h-8 text-xs font-bold w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="min-w-[200px]">
										<SelectItem value="Completed">Completed</SelectItem>
										<SelectItem value="In-Progress">In-Progress</SelectItem>
										<SelectItem value="Pending">Pending</SelectItem>
										<SelectItem value="Cancelled">Cancelled</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* 3. ORDER ITEMS & PRODUCT SEARCH */}
						<div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 shrink-0">
									<Package className="size-4 text-primary" />
									Order Spare Parts ({items.length} lines)
								</h4>

								{/* Quick Search & Add Missing Part */}
								<div className="relative w-full sm:w-[420px] md:w-[500px] lg:w-[560px]">
									<Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
									<Input
										type="text"
										value={productSearchQuery}
										onChange={(e) => setProductSearchQuery(e.target.value)}
										onFocus={() => {
											if (searchResults.length > 0) setIsSearchOpen(true);
										}}
										placeholder="Search parts by name, model (CD70, CG125), or SKU..."
										className="h-8.5 pl-9 pr-8 text-xs bg-muted/40 w-full rounded-lg"
									/>
									{isSearchingProducts && (
										<Loader2 className="size-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
									)}
									{productSearchQuery && !isSearchingProducts && (
										<button
											type="button"
											onClick={() => {
												setProductSearchQuery("");
												setIsSearchOpen(false);
											}}
											className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
										>
											<X className="size-3.5" />
										</button>
									)}

									{/* Search Results Dropdown with Full Product Details */}
									{isSearchOpen && searchResults.length > 0 && (
										<div className="absolute right-0 top-full mt-1.5 z-50 bg-popover border rounded-xl shadow-2xl p-2 space-y-1 max-h-72 overflow-y-auto w-full min-w-[340px] sm:min-w-[480px] md:min-w-[560px]">
											<div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b flex justify-between items-center">
												<span>Found {searchResults.length} matching products</span>
												<span className="text-[10px] text-muted-foreground">Click item to add</span>
											</div>
											{searchResults.map((prod) => (
												<div
													key={prod.id}
													onClick={() => handleAddProduct(prod)}
													className="p-2 rounded-lg hover:bg-muted/80 cursor-pointer flex items-center justify-between text-xs transition-colors border border-transparent hover:border-border gap-3"
												>
													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-2 flex-wrap">
															<span className="font-semibold text-foreground text-xs">
																{prod.name}
															</span>
															{prod.sku && (
																<span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
																	{prod.sku}
																</span>
															)}
														</div>
														<div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
															<span className="font-medium text-primary">🏍️ {prod.bikeModel || "Universal"}</span>
															<span>•</span>
															<span>📦 {prod.category}</span>
															<span>•</span>
															<span className={prod.totalStock > 0 ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
																Stock: {prod.totalStock} {prod.unit || "Pcs"}
															</span>
														</div>
													</div>
													<div className="flex items-center gap-2 shrink-0">
														<div className="text-right">
															<span className="font-mono font-bold text-xs text-foreground block">
																Rs. {(prod.price || 0).toLocaleString()}
															</span>
															{prod.retailPrice && prod.retailPrice !== prod.price && (
																<span className="text-[10px] text-muted-foreground block line-through">
																	Rs. {prod.retailPrice.toLocaleString()}
																</span>
															)}
														</div>
														<Button size="xs" variant="default" className="h-7 px-2.5 text-[11px] gap-1 font-semibold cursor-pointer">
															<Plus className="size-3.5" /> Add
														</Button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</div>

							<div className="overflow-x-auto rounded-xl border">
								<table className="w-full text-xs text-left">
									<thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
										<tr>
											<th className="py-2.5 px-3">Item Description</th>
											<th className="py-2.5 px-3 w-32 text-center">Rate (PKR)</th>
											<th className="py-2.5 px-3 w-28 text-center">Qty</th>
											<th className="py-2.5 px-3 w-36 text-right">Line Total (PKR)</th>
											<th className="py-2.5 px-2 w-10 text-center"></th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{items.map((it, idx) => (
											<tr key={idx} className="hover:bg-muted/20">
												<td className="py-2.5 px-3">
													<div className="font-bold text-foreground text-xs sm:text-sm truncate max-w-sm">
														{it.name}
													</div>
													{it.subLabel && (
														<div className="text-[11px] text-muted-foreground mt-0.5">
															{it.subLabel}
														</div>
													)}
												</td>
												<td className="py-2.5 px-3 text-center">
													<Input
														type="number"
														min={0}
														value={it.rate}
														onChange={(e) =>
															handleItemChange(idx, "rate", parseFloat(e.target.value) || 0)
														}
														className="h-8 w-28 text-center font-mono font-bold text-xs mx-auto bg-background"
													/>
												</td>
												<td className="py-2.5 px-3 text-center">
													<Input
														type="number"
														min={1}
														value={it.quantity}
														onChange={(e) =>
															handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)
														}
														className="h-8 w-24 text-center font-mono font-bold text-xs mx-auto bg-background"
													/>
												</td>
												<td className="py-2.5 px-3 text-right font-mono font-bold text-xs sm:text-sm text-foreground">
													Rs. {(it.quantity * it.rate).toLocaleString()}
												</td>
												<td className="py-2.5 px-2 text-center">
													{items.length > 1 && (
														<button
															type="button"
															onClick={() => handleRemoveItem(idx)}
															className="text-muted-foreground hover:text-rose-600 cursor-pointer p-1 rounded"
															title="Remove Item"
														>
															<Trash2 className="size-4" />
														</button>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						{/* 4. FINANCIALS & PAYMENT ADJUSTMENTS */}
						<div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-4">
							<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
								<Banknote className="size-4 text-primary" />
								Bill & Payment Channels
							</h4>

							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
								<div className="space-y-1">
									<label className="text-xs font-semibold text-muted-foreground">Gross Subtotal:</label>
									<div className="h-9 px-3 flex items-center font-mono font-bold text-xs sm:text-sm bg-muted/40 rounded-xl border">
										Rs. {subtotal.toLocaleString()}
									</div>
								</div>

								{/* Discount Switch */}
								<div className="space-y-1">
									<div className="flex items-center justify-between">
										<label className="text-xs font-semibold text-muted-foreground">Discount:</label>
										<div className="flex items-center bg-muted/80 p-0.5 rounded-lg border border-border/60">
											<button
												type="button"
												onClick={handleSwitchToFixed}
												className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
													discountMode === "fixed"
														? "bg-background text-foreground shadow-2xs"
														: "text-muted-foreground hover:text-foreground"
												}`}
												title="Fixed Rupee Discount"
											>
												Rs.
											</button>
											<button
												type="button"
												onClick={handleSwitchToPercent}
												className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
													discountMode === "percent"
														? "bg-primary text-primary-foreground shadow-2xs"
														: "text-muted-foreground hover:text-foreground"
												}`}
												title="Percentage Discount (e.g. 5%)"
											>
												%
											</button>
										</div>
									</div>
									<div className="relative">
										<Input
											type="text"
											value={discountInput}
											onChange={(e) => handleDiscountInputChange(e.target.value)}
											placeholder={discountMode === "percent" ? "e.g. 5 or 10" : "e.g. 500"}
											className="h-9 pr-14 text-xs sm:text-sm font-mono font-bold bg-background"
										/>
										<span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-muted-foreground pointer-events-none bg-muted/80 px-1.5 py-0.5 rounded border border-border/50">
											{discountMode === "percent" ? "% OFF" : "PKR"}
										</span>
									</div>
									<div className="flex items-center justify-between text-[11px] min-h-[16px] px-0.5">
										{discountMode === "percent" ? (
											<span className="text-primary font-semibold font-mono">
												= Rs. {discountAmount.toLocaleString()} off
											</span>
										) : (
											<span className="text-muted-foreground font-mono">
												{subtotal > 0 && discountAmount > 0
													? `~${((discountAmount / subtotal) * 100).toFixed(1)}% of bill`
													: "Flat cash discount"}
											</span>
										)}
									</div>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-semibold text-muted-foreground">Shipping / Fitting (PKR):</label>
									<Input
										type="number"
										min={0}
										value={shippingCharges}
										onChange={(e) => setShippingCharges(Math.max(0, parseFloat(e.target.value) || 0))}
										className="h-9 text-xs sm:text-sm font-mono font-bold bg-background"
									/>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-bold text-foreground">Net Bill Amount:</label>
									<div className="h-9 px-3 flex items-center font-mono font-black text-sm sm:text-base bg-primary/10 text-primary rounded-xl border border-primary/20">
										Rs. {netBill.toLocaleString()}
									</div>
								</div>
							</div>

							{/* Payment Method Selector */}
							<div className="pt-2 border-t space-y-3">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="space-y-1">
										<label className="text-xs font-semibold text-muted-foreground">Payment Method:</label>
										<Select
											value={paymentMethod}
											onValueChange={(val) => {
												setPaymentMethod(val || "Cash on Counter");
												if (val === "Online Transfer") {
													setCashReceived(0);
													setOnlineReceived(netBill);
												} else if (val === "Cash on Counter") {
													setCashReceived(netBill);
													setOnlineReceived(0);
												}
											}}
										>
											<SelectTrigger className="h-9 text-xs font-bold w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="min-w-[280px] sm:min-w-[340px]" align="start">
												<SelectItem value="Cash on Counter">Cash on Counter</SelectItem>
												<SelectItem value="Online Transfer">Online Transfer (Bank / Wallet)</SelectItem>
												<SelectItem value="Split (Cash + Online)">Split (Cash + Online)</SelectItem>
												<SelectItem value="Credit / Khata">Credit / Khata Ledger</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Receiving Bank Account Dropdown (For Online or Split) */}
									{(paymentMethod === "Online Transfer" || paymentMethod.includes("Split")) && (
										<div className="space-y-1">
											<div className="flex items-center justify-between">
												<label className="text-xs font-semibold text-sky-800 dark:text-sky-300 flex items-center gap-1">
													<Landmark className="size-3.5 text-sky-600" />
													Receiving Bank Account:
												</label>
												<Link
													href="/dashboard/bank-accounts"
													target="_blank"
													className="text-[10px] text-sky-600 hover:underline"
												>
													Manage ↗
												</Link>
											</div>
											<select
												value={selectedBankAccountId || ""}
												onChange={(e) => {
													const id = e.target.value;
													setSelectedBankAccountId(id);
													const acc = bankAccounts.find((b) => b.id === id);
													setSelectedBankAccountName(acc ? `${acc.bankName} - ${acc.accountNumber}` : null);
												}}
												className="w-full h-8 px-2 text-xs font-semibold rounded-lg border border-sky-400/50 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
											>
												<option value="">Select Receiving Bank...</option>
												{bankAccounts.map((b) => (
													<option key={b.id} value={b.id}>
														{b.bankName} — {b.accountNumber} ({b.accountTitle})
													</option>
												))}
											</select>
										</div>
									)}
								</div>

								{/* Split / Cash Amounts */}
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
									<div className="space-y-1">
										<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
											<Banknote className="size-3.5 text-emerald-600" />
											Cash Received:
										</label>
										<Input
											type="number"
											min={0}
											value={cashReceived}
											onChange={(e) => setCashReceived(Math.max(0, parseFloat(e.target.value) || 0))}
											className="h-8 text-xs font-mono font-bold bg-background"
										/>
									</div>

									<div className="space-y-1">
										<div className="flex items-center justify-between">
											<label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
												<Smartphone className="size-3.5 text-sky-600" />
												Online Received:
											</label>
											{paymentMethod.includes("Split") && (
												<button
													type="button"
													onClick={() => setOnlineReceived(Math.max(0, netBill - cashReceived))}
													className="text-[9px] font-bold text-sky-700 dark:text-sky-300 underline cursor-pointer"
												>
													⚡ Auto-Balance
												</button>
											)}
										</div>
										<Input
											type="number"
											min={0}
											value={onlineReceived}
											onChange={(e) => setOnlineReceived(Math.max(0, parseFloat(e.target.value) || 0))}
											className="h-8 text-xs font-mono font-bold bg-background"
										/>
									</div>

									<div className="space-y-1">
										<label className="text-xs font-semibold text-muted-foreground">Khata Balance Due:</label>
										<div
											className={`h-8 px-2.5 flex items-center font-mono font-bold text-xs rounded-lg border ${
												balanceDue > 0
													? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
													: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
											}`}
										>
											Rs. {balanceDue.toLocaleString()}
										</div>
									</div>
								</div>

								{/* WHATSAPP PAYMENT SLIP ATTACHMENT BOX IN EDIT DIALOG (Hidden for Cash on Counter) */}
								{paymentMethod !== "Cash on Counter" && (
									<div className="pt-2 border-t">
										<input
											type="file"
											ref={fileInputRef}
											accept="image/*"
											className="hidden"
											onChange={(e) => {
												const file = e.target.files?.[0];
												if (file) handleUploadSlipFile(file);
												e.target.value = "";
											}}
										/>

										{paymentSlipUrl ? (
											<div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 flex items-center justify-between gap-3 shadow-2xs">
												<div className="flex items-center gap-2.5 overflow-hidden">
													<div
														onClick={() => setPreviewSlipModalOpen(true)}
														className="relative size-12 rounded-lg border border-emerald-500/30 overflow-hidden shrink-0 bg-muted cursor-pointer group"
														title="Click to enlarge slip"
													>
														<img
															src={paymentSlipUrl}
															alt="WhatsApp Payment Slip"
															className="size-full object-cover group-hover:scale-105 transition-transform"
														/>
														<div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
															<Eye className="size-3.5 text-white" />
														</div>
													</div>
													<div className="min-w-0">
														<div className="flex items-center gap-1.5">
															<Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4 font-bold">
																Verified Slip
															</Badge>
															<span className="text-xs font-bold text-foreground truncate">
																WhatsApp Payment Proof Attached
															</span>
														</div>
														<span className="text-[10px] text-muted-foreground block truncate">
															Saved in database • Click to view full screenshot
														</span>
													</div>
												</div>
												<div className="flex items-center gap-1 shrink-0">
													<Button
														type="button"
														size="icon"
														variant="ghost"
														onClick={() => setPreviewSlipModalOpen(true)}
														className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
														title="Enlarge Slip"
													>
														<Eye className="size-3.5" />
													</Button>
													<Button
														type="button"
														size="icon"
														variant="ghost"
														onClick={() => setPaymentSlipUrl(null)}
														className="size-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
														title="Remove Slip"
													>
														<Trash2 className="size-3.5" />
													</Button>
												</div>
											</div>
										) : (
											<div
												onClick={() => fileInputRef.current?.click()}
												className="border-2 border-dashed border-sky-500/40 hover:border-sky-500/70 bg-sky-500/5 hover:bg-sky-500/10 rounded-xl p-3 text-center cursor-pointer transition-colors"
											>
												{isUploadingSlip ? (
													<div className="flex items-center justify-center gap-2 text-xs text-sky-600">
														<Loader2 className="size-4 animate-spin" />
														<span>Uploading slip screenshot...</span>
													</div>
												) : (
													<div className="space-y-1">
														<div className="flex items-center justify-center gap-1.5 text-sky-700 dark:text-sky-300 font-bold text-xs">
															<Plus className="size-3.5 text-sky-600" />
															<span>Attach / Upload WhatsApp Payment Slip</span>
															<span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-500/20 px-1.5 py-0.5 rounded border border-sky-500/30">
																Ctrl + V
															</span>
														</div>
														<p className="text-[10px] text-muted-foreground">
															Click to browse or press <strong>Ctrl+V</strong> to paste copied screenshot from WhatsApp
														</p>
													</div>
												)}
											</div>
										)}
									</div>
								)}
							</div>
						</div>

						{/* 5. REMARKS */}
						<div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-2">
							<label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
								<FileText className="size-4 text-primary" />
								Remarks / Warranty Notes:
							</label>
							<textarea
								rows={2}
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
								className="w-full text-xs sm:text-sm p-3 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
								placeholder="e.g. 7 Days Check Warranty Only (Return / Exchange within 7 days)"
							/>
						</div>

						{/* Sticky Footer */}
						<DialogFooter className="p-0 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t">
							<span className="text-xs text-muted-foreground font-mono">
								Invoice ID: <strong className="text-foreground">{order.id}</strong>
							</span>
							<div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
								<Button
									type="button"
									variant="outline"
									onClick={onClose}
									disabled={isSubmitting}
									className="text-xs cursor-pointer h-9 px-4"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={isSubmitting || items.length === 0}
									className="text-xs cursor-pointer h-9 px-5 gap-2 font-semibold"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="size-4 animate-spin" />
											<span>Saving...</span>
										</>
									) : (
										<>
											<CheckCircle2 className="size-4" />
											<span>Save Changes</span>
										</>
									)}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* ENLARGED SLIP MODAL */}
			<Dialog open={previewSlipModalOpen} onOpenChange={setPreviewSlipModalOpen}>
				<DialogContent className="w-[92vw] sm:max-w-2xl p-4">
					<DialogHeader>
						<DialogTitle className="text-sm font-bold flex items-center gap-2">
							<Paperclip className="size-4 text-emerald-600" />
							WhatsApp Payment Proof Screenshot
						</DialogTitle>
					</DialogHeader>
					{paymentSlipUrl && (
						<div className="relative w-full max-h-[75vh] flex items-center justify-center bg-black/5 rounded-xl overflow-hidden p-2">
							<img
								src={paymentSlipUrl}
								alt="WhatsApp Payment Proof"
								className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md"
							/>
						</div>
					)}
					<DialogFooter className="flex justify-between items-center sm:justify-between pt-2">
						<a
							href={paymentSlipUrl || "#"}
							target="_blank"
							rel="noreferrer"
							className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-medium"
						>
							<ExternalLink className="size-3" />
							Open Full Resolution in New Tab
						</a>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => setPreviewSlipModalOpen(false)}
							className="text-xs"
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
