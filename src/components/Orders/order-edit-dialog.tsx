"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { updateOrder } from "@/lib/api/orders/orders-api";
import type { OrderRecord, OrderStatus, OrderType } from "./types";

interface OrderEditDialogProps {
	order: OrderRecord | null;
	isOpen: boolean;
	onClose: () => void;
	onOrderUpdated?: () => void;
}

interface EditableOrderItem {
	id?: string;
	name: string;
	subLabel?: string;
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
			setFeedbackMsg(null);

			if (Array.isArray(order.items) && order.items.length > 0) {
				setItems(
					order.items.map((it: any) => ({
						id: it.id,
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
					name: it.name,
					quantity: it.quantity,
					rate: it.rate,
					lineTotal: it.quantity * it.rate,
				})),
			});

			setFeedbackMsg({ type: "success", text: "Order details updated successfully!" });
			onOrderUpdated?.();
			setTimeout(() => {
				onClose();
			}, 1000);
		} catch (err: any) {
			console.error("Order update failed:", err);
			setFeedbackMsg({ type: "error", text: err.message || "Failed to update order" });
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!order) return null;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-5xl max-h-[92vh] overflow-y-auto p-0 gap-0 border border-border/80 bg-background rounded-2xl shadow-2xl">
				{/* Top Header */}
				<DialogHeader className="p-5 sm:p-6 pb-4 border-b bg-card/90 backdrop-blur-xs sticky top-0 z-20">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
								<Pencil className="size-5" />
							</div>
							<div>
								<div className="flex items-center gap-2 flex-wrap">
									<DialogTitle className="text-lg sm:text-xl font-bold font-heading text-foreground">
										Edit Invoice #{order.invoiceNumber}
									</DialogTitle>
									<Badge variant="outline" className="text-xs font-mono font-bold bg-muted/50">
										{order.branchShortName || "Saddar Main"}
									</Badge>
									<Badge
										className={`text-xs font-semibold ${
											orderStatus === "Completed"
												? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
												: orderStatus === "Pending"
												? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
												: "bg-muted text-muted-foreground"
										}`}
										variant="outline"
									>
										{orderStatus}
									</Badge>
								</div>
								<DialogDescription className="text-xs text-muted-foreground mt-0.5">
									Modify customer details, product quantities, rates, and cash adjustments with auto-recalculation.
								</DialogDescription>
							</div>
						</div>

						<Link
							href={`/dashboard/orders/edit/${order.invoiceNumber}`}
							className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 shrink-0 self-start sm:self-auto"
						>
							Full Page View <ExternalLink className="size-3" />
						</Link>
					</div>

					{feedbackMsg && (
						<div
							className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-in fade-in ${
								feedbackMsg.type === "success"
									? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
									: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
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
				</DialogHeader>

				<form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
					{/* 1. CUSTOMER INFORMATION */}
					<div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
						<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
							<User className="size-4 text-primary" />
							Customer Information
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
							<div className="space-y-1 sm:col-span-2">
								<label className="text-xs font-semibold text-muted-foreground">
									Customer / Party Name:
								</label>
								<Input
									value={customerName}
									onChange={(e) => setCustomerName(e.target.value)}
									className="h-9 text-xs sm:text-sm bg-background font-medium"
									required
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-semibold text-muted-foreground">
									Phone Number:
								</label>
								<Input
									value={customerPhone}
									onChange={(e) => setCustomerPhone(e.target.value)}
									className="h-9 text-xs sm:text-sm bg-background"
									placeholder="0333-1285556"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-semibold text-muted-foreground">
									City / Market:
								</label>
								<Input
									value={customerCity}
									onChange={(e) => setCustomerCity(e.target.value)}
									className="h-9 text-xs sm:text-sm bg-background"
								/>
							</div>
						</div>
					</div>

					{/* 2. STATUS & PAYMENT TERMS */}
					<div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
						<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
							<CreditCard className="size-4 text-primary" />
							Status & Payment Method
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="space-y-1 w-full">
								<label className="text-xs font-semibold text-muted-foreground">
									Order Status:
								</label>
								<Select
									value={orderStatus}
									onValueChange={(val) => setOrderStatus(val as OrderStatus)}
								>
									<SelectTrigger className="w-full h-9 text-xs sm:text-sm bg-background font-semibold">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Completed" className="text-xs">
											Completed
										</SelectItem>
										<SelectItem value="Pending" className="text-xs">
											Pending
										</SelectItem>
										<SelectItem value="In-Progress" className="text-xs">
											In-Progress
										</SelectItem>
										<SelectItem value="Cancelled" className="text-xs">
											Cancelled
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1 w-full">
								<label className="text-xs font-semibold text-muted-foreground">
									Order Type:
								</label>
								<Select
									value={orderType}
									onValueChange={(val) => setOrderType(val as OrderType)}
								>
									<SelectTrigger className="w-full h-9 text-xs sm:text-sm bg-background font-semibold">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Wholesale" className="text-xs">
											Wholesale
										</SelectItem>
										<SelectItem value="Retail" className="text-xs">
											Retail
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1 w-full">
								<label className="text-xs font-semibold text-muted-foreground">
									Payment Terms:
								</label>
								<Select
									value={paymentMethod}
									onValueChange={(val) => {
										if (val) setPaymentMethod(val);
									}}
								>
									<SelectTrigger className="w-full h-9 text-xs sm:text-sm bg-background font-semibold">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Cash on Counter" className="text-xs">
											Cash on Counter
										</SelectItem>
										<SelectItem value="Online Transfer" className="text-xs">
											Online Transfer (Bank / Raast)
										</SelectItem>
										<SelectItem value="Credit / Khata" className="text-xs">
											Credit / Khata Ledger
										</SelectItem>
										<SelectItem value="Split (Cash + Online)" className="text-xs">
											Split (Cash + Online)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* 3. ORDER ITEMS TABLE */}
					<div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
						<div className="flex items-center justify-between border-b pb-2.5">
							<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
								<Package className="size-4 text-primary" />
								Order Items ({items.length})
							</h4>
							<span className="text-xs text-muted-foreground font-mono">
								Total Qty: <strong className="text-foreground">{items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)}</strong>
							</span>
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
					<div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
						<h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
							<Banknote className="size-4 text-primary" />
							Bill & Payment Adjustments
						</h4>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
							<div className="space-y-1">
								<label className="text-xs font-semibold text-muted-foreground">
									Gross Subtotal:
								</label>
								<div className="h-9 px-3 flex items-center font-mono font-bold text-xs sm:text-sm bg-muted/40 rounded-xl border">
									Rs. {subtotal.toLocaleString()}
								</div>
							</div>

							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<label className="text-xs font-semibold text-muted-foreground">
										Discount:
									</label>
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
								<label className="text-xs font-semibold text-muted-foreground">
									Shipping / Fitting (PKR):
								</label>
								<Input
									type="number"
									min={0}
									value={shippingCharges}
									onChange={(e) => setShippingCharges(Math.max(0, parseFloat(e.target.value) || 0))}
									className="h-9 text-xs sm:text-sm font-mono font-bold bg-background"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-bold text-foreground">
									Net Bill Amount:
								</label>
								<div className="h-9 px-3 flex items-center font-mono font-black text-sm sm:text-base bg-primary/10 text-primary rounded-xl border border-primary/20">
									Rs. {netBill.toLocaleString()}
								</div>
							</div>
						</div>

						{/* Cash & Online Split */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t">
							<div className="space-y-1">
								<label className="text-xs font-semibold text-muted-foreground">
									Cash Received:
								</label>
								<Input
									type="number"
									min={0}
									value={cashReceived}
									onChange={(e) => setCashReceived(Math.max(0, parseFloat(e.target.value) || 0))}
									className="h-9 text-xs sm:text-sm font-mono font-bold bg-background"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-semibold text-muted-foreground">
									Online Received (Bank):
								</label>
								<Input
									type="number"
									min={0}
									value={onlineReceived}
									onChange={(e) => setOnlineReceived(Math.max(0, parseFloat(e.target.value) || 0))}
									className="h-9 text-xs sm:text-sm font-mono font-bold bg-background"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-semibold text-muted-foreground">
									Khata Balance Due:
								</label>
								<div
									className={`h-9 px-3 flex items-center font-mono font-bold text-xs sm:text-sm rounded-xl border ${
										balanceDue > 0
											? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
											: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
									}`}
								>
									Rs. {balanceDue.toLocaleString()}
								</div>
							</div>
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
	);
}
