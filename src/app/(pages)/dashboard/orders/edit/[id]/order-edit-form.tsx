"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchOrderById, updateOrder } from "@/lib/api/orders/orders-api";
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
	ArrowLeft,
	User,
	CreditCard,
	Banknote,
	Package,
	Trash2,
	CheckCircle2,
	AlertTriangle,
	Loader2,
	FileText,
} from "lucide-react";
import type { OrderStatus, OrderType } from "@/components/Orders/types";

interface EditableOrderItem {
	id?: string;
	name: string;
	subLabel?: string;
	quantity: number;
	rate: number;
	total: number;
}

export function OrderEditForm({ orderId }: { orderId: string }) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { data, isLoading, isError } = useQuery({
		queryKey: ["order", orderId],
		queryFn: () => fetchOrderById(orderId),
	});

	const order = data?.data;

	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [customerCity, setCustomerCity] = useState("Karachi");
	const [orderType, setOrderType] = useState<OrderType>("Wholesale");
	const [orderStatus, setOrderStatus] = useState<OrderStatus>("Completed");
	const [paymentMethod, setPaymentMethod] = useState("Cash on Counter");
	const [items, setItems] = useState<EditableOrderItem[]>([]);
	const [discountAmount, setDiscountAmount] = useState(0);
	const [shippingCharges, setShippingCharges] = useState(0);
	const [cashReceived, setCashReceived] = useState(0);
	const [onlineReceived, setOnlineReceived] = useState(0);
	const [remarks, setRemarks] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

	useEffect(() => {
		if (order) {
			setCustomerName(order.customerName || "");
			setCustomerPhone(order.customerPhone === "N/A" ? "" : order.customerPhone || "");
			setCustomerCity(order.customerCity || "Karachi");
			setOrderType(order.type || "Wholesale");
			setOrderStatus(order.status || "Completed");
			setPaymentMethod(order.paymentMethod || "Cash on Counter");
			setDiscountAmount(Number(order.discountAmount) || 0);
			setShippingCharges(Number(order.shippingCharges) || 0);
			setCashReceived(Number(order.cashReceived) || 0);
			setOnlineReceived(Number(order.onlineReceived) || 0);
			setRemarks(order.remarks || "");

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
			}
		}
	}, [order]);

	const subtotal = useMemo(() => {
		return items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
	}, [items]);

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

			queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
			queryClient.invalidateQueries({ queryKey: ["order", orderId] });
			setFeedbackMsg({ type: "success", text: "Order updated successfully! Redirecting to orders..." });

			setTimeout(() => {
				router.push("/dashboard/orders");
			}, 1000);
		} catch (err: any) {
			console.error("Order update failed:", err);
			setFeedbackMsg({ type: "error", text: err.message || "Failed to update order" });
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-28 text-muted-foreground">
				<Loader2 className="size-8 animate-spin text-primary mb-3" />
				<p className="text-sm font-semibold">Loading order details...</p>
			</div>
		);
	}

	if (isError || !order) {
		return (
			<div className="max-w-2xl mx-auto py-20 text-center space-y-4">
				<AlertTriangle className="size-10 text-rose-600 mx-auto" />
				<h2 className="text-lg font-bold">Order Not Found</h2>
				<p className="text-xs text-muted-foreground">
					Could not find invoice #{orderId} in the database.
				</p>
				<Link href="/dashboard/orders">
					<Button variant="outline" size="sm" className="gap-2 cursor-pointer">
						<ArrowLeft className="size-3.5" /> Back to Orders
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6 pb-20">
			{/* Breadcrumb & Navigation */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Link
							href="/dashboard/orders"
							className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
						>
							<ArrowLeft className="size-3.5" /> Back to Orders
						</Link>
						<span className="text-muted-foreground">•</span>
						<span className="text-xs font-semibold text-primary">Edit Invoice</span>
					</div>
					<div className="flex items-center gap-3">
						<h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">
							Edit Order #{order.invoiceNumber}
						</h1>
						<Badge variant="outline" className="text-xs font-mono">
							{order.branchShortName || "Saddar Main"}
						</Badge>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Link href="/dashboard/orders">
						<Button variant="outline" size="sm" className="cursor-pointer text-xs">
							Cancel
						</Button>
					</Link>
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting || items.length === 0}
						size="sm"
						className="gap-1.5 cursor-pointer text-xs font-medium"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="size-3.5 animate-spin" />
								<span>Saving Changes...</span>
							</>
						) : (
							<>
								<CheckCircle2 className="size-3.5" />
								<span>Save Changes</span>
							</>
						)}
					</Button>
				</div>
			</div>

			{feedbackMsg && (
				<div
					className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
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

			<form onSubmit={handleSubmit} className="space-y-5">
				{/* 1. CUSTOMER INFO */}
				<div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
					<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
						<User className="size-4 text-primary" />
						Customer & Delivery Information
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
						<div className="space-y-1 sm:col-span-2">
							<label className="text-xs font-semibold text-muted-foreground">
								Customer / Party Name:
							</label>
							<Input
								value={customerName}
								onChange={(e) => setCustomerName(e.target.value)}
								className="h-9 text-xs bg-background"
								required
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-semibold text-muted-foreground">
								Contact Phone:
							</label>
							<Input
								value={customerPhone}
								onChange={(e) => setCustomerPhone(e.target.value)}
								className="h-9 text-xs bg-background"
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
								className="h-9 text-xs bg-background"
							/>
						</div>
					</div>
				</div>

				{/* 2. ORDER STATUS & PAYMENT */}
				<div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
					<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
						<CreditCard className="size-4 text-primary" />
						Order Status & Payment Terms
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
						<div className="space-y-1 w-full">
							<label className="text-xs font-semibold text-muted-foreground">
								Order Status:
							</label>
							<Select
								value={orderStatus}
								onValueChange={(val) => setOrderStatus(val as OrderStatus)}
							>
								<SelectTrigger className="w-full h-9 text-xs bg-background font-semibold">
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
								<SelectTrigger className="w-full h-9 text-xs bg-background font-semibold">
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
								<SelectTrigger className="w-full h-9 text-xs bg-background font-semibold">
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
				<div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
					<div className="flex items-center justify-between border-b pb-3">
						<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
							<Package className="size-4 text-primary" />
							Order Items ({items.length})
						</h3>
						<span className="text-xs text-muted-foreground font-mono">
							Total Delivered Qty: <strong>{items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)}</strong>
						</span>
					</div>

					<div className="overflow-x-auto rounded-xl border">
						<table className="w-full text-xs text-left">
							<thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
								<tr>
									<th className="py-2.5 px-3">Item Description</th>
									<th className="py-2.5 px-3 w-32 text-center">Rate (PKR)</th>
									<th className="py-2.5 px-3 w-28 text-center">Qty</th>
									<th className="py-2.5 px-3 w-32 text-right">Line Total (PKR)</th>
									<th className="py-2.5 px-2 w-10 text-center"></th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{items.map((it, idx) => (
									<tr key={idx} className="hover:bg-muted/20">
										<td className="py-2.5 px-3">
											<div className="font-semibold text-foreground truncate max-w-sm">
												{it.name}
											</div>
											{it.subLabel && (
												<div className="text-[10px] text-muted-foreground">
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
										<td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
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
													<Trash2 className="size-3.5" />
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* 4. FINANCIALS */}
				<div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
					<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
						<Banknote className="size-4 text-primary" />
						Financials & Payments
					</h3>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-muted-foreground">
								Gross Subtotal:
							</label>
							<div className="h-9 px-3 flex items-center font-mono font-bold text-xs bg-muted/40 rounded-xl border">
								Rs. {subtotal.toLocaleString()}
							</div>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-muted-foreground">
								Discount (PKR):
							</label>
							<Input
								type="number"
								min={0}
								value={discountAmount}
								onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
								className="h-9 text-xs font-mono font-bold bg-background"
							/>
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
								className="h-9 text-xs font-mono font-bold bg-background"
							/>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-bold text-foreground">
								Net Bill Amount:
							</label>
							<div className="h-9 px-3 flex items-center font-mono font-black text-sm bg-primary/10 text-primary rounded-xl border border-primary/20">
								Rs. {netBill.toLocaleString()}
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-muted-foreground">
								Cash Received:
							</label>
							<Input
								type="number"
								min={0}
								value={cashReceived}
								onChange={(e) => setCashReceived(Math.max(0, parseFloat(e.target.value) || 0))}
								className="h-9 text-xs font-mono font-bold bg-background"
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
								className="h-9 text-xs font-mono font-bold bg-background"
							/>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-muted-foreground">
								Khata Balance Due:
							</label>
							<div
								className={`h-9 px-3 flex items-center font-mono font-bold text-xs rounded-xl border ${
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
				<div className="rounded-2xl border bg-card p-5 shadow-xs space-y-2">
					<label className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
						<FileText className="size-4 text-primary" />
						Remarks / Warranty Notes:
					</label>
					<textarea
						rows={3}
						value={remarks}
						onChange={(e) => setRemarks(e.target.value)}
						className="w-full text-xs p-3 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
						placeholder="e.g. 7 Days Check Warranty Only (Return / Exchange within 7 days)"
					/>
				</div>

				{/* Action Bottom Bar */}
				<div className="flex items-center justify-end gap-3 pt-3">
					<Link href="/dashboard/orders">
						<Button type="button" variant="outline" className="cursor-pointer text-xs">
							Cancel
						</Button>
					</Link>
					<Button
						type="submit"
						disabled={isSubmitting || items.length === 0}
						className="gap-1.5 cursor-pointer text-xs font-medium"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="size-3.5 animate-spin" />
								<span>Saving Changes...</span>
							</>
						) : (
							<>
								<CheckCircle2 className="size-3.5" />
								<span>Save Changes</span>
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}
