"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	X,
	BookOpen,
	ArrowUpRight,
	ArrowDownLeft,
	CreditCard,
	Loader2,
	Building2,
	Receipt,
	Calendar,
} from "lucide-react";
import type { VendorProfile, VendorTransaction } from "./types";

interface VendorLedgerModalProps {
	vendor: VendorProfile | null;
	isOpen: boolean;
	onClose: () => void;
}

export function VendorLedgerModal({ vendor, isOpen, onClose }: VendorLedgerModalProps) {
	const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
	const [showPaymentForm, setShowPaymentForm] = useState(false);

	// New payment inputs
	const [payAmount, setPayAmount] = useState<number>(0);
	const [paymentMode, setPaymentMode] = useState<string>("Cash");
	const [refNumber, setRefNumber] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [currentBalance, setCurrentBalance] = useState<number>(vendor?.currentBalance || 0);

	const fetchLedger = async () => {
		if (!vendor) return;
		setIsLoading(true);
		try {
			const res = await fetch(`/api/vendors/${vendor.id}/ledger`);
			const data = await res.json();
			if (data.transactions) {
				setTransactions(data.transactions);
			}
			if (data.vendor) {
				setCurrentBalance(data.vendor.currentBalance);
			}
		} catch (err) {
			console.error("Failed to load vendor ledger:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen && vendor) {
			setCurrentBalance(vendor.currentBalance || 0);
			setShowPaymentForm(false);
			fetchLedger();
		}
	}, [isOpen, vendor]);

	if (!isOpen || !vendor) return null;

	const handleRecordPayment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!payAmount || payAmount <= 0) return;

		setIsSubmittingPayment(true);
		try {
			const res = await fetch(`/api/vendors/${vendor.id}/ledger`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: payAmount,
					transactionType: "PAYMENT",
					paymentMode,
					referenceNumber: refNumber,
					description: description || `Payment to ${vendor.name} via ${paymentMode}`,
				}),
			});

			if (res.ok) {
				setPayAmount(0);
				setRefNumber("");
				setDescription("");
				setShowPaymentForm(false);
				fetchLedger();
			}
		} catch (err) {
			console.error("Failed to record payment:", err);
		} finally {
			setIsSubmittingPayment(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
			onClick={onClose}
		>
			<div
				className="bg-card border rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="p-4 border-b flex items-center justify-between bg-muted/30">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
							<Building2 className="size-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="font-heading font-bold text-sm text-foreground">
									{vendor.name}
								</h3>
								<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
									{vendor.id}
								</span>
							</div>
							<p className="text-xs text-muted-foreground">
								Vendor Khata Ledger • Phone: {vendor.phone} • {vendor.city}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
					>
						<X className="size-4" />
					</button>
				</div>

				{/* Balance Summary Bar */}
				<div className="p-4 bg-muted/20 border-b flex items-center justify-between flex-wrap gap-3">
					<div>
						<span className="text-xs text-muted-foreground block">
							Current Outstanding Balance (Payable):
						</span>
						<span
							className={`font-mono font-black text-xl ${
								currentBalance > 0
									? "text-rose-600 dark:text-rose-400"
									: "text-emerald-600 dark:text-emerald-400"
							}`}
						>
							Rs. {currentBalance.toLocaleString()}
						</span>
					</div>

					<Button
						type="button"
						size="sm"
						onClick={() => setShowPaymentForm(!showPaymentForm)}
						className="gap-1.5 text-xs font-bold cursor-pointer"
					>
						<CreditCard className="size-3.5" />
						{showPaymentForm ? "Cancel Payment" : "+ Record Payment to Vendor"}
					</Button>
				</div>

				{/* Optional Payment Form */}
				{showPaymentForm && (
					<form
						onSubmit={handleRecordPayment}
						className="p-4 bg-muted/40 border-b space-y-3 animate-in slide-in-from-top-2"
					>
						<h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
							<CreditCard className="size-3.5 text-primary" />
							Record Payment Made to Supplier
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div>
								<label className="text-[11px] font-semibold text-muted-foreground block mb-1">
									Payment Amount (Rs.) *
								</label>
								<Input
									type="number"
									placeholder="0"
									value={payAmount || ""}
									onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
									className="h-8 text-xs font-mono font-bold"
									required
								/>
							</div>
							<div>
								<label className="text-[11px] font-semibold text-muted-foreground block mb-1">
									Payment Method
								</label>
								<select
									value={paymentMode}
									onChange={(e) => setPaymentMode(e.target.value)}
									className="w-full h-8 px-2 rounded-md border text-xs bg-background focus:outline-none"
								>
									<option value="Cash">Cash on Hand</option>
									<option value="Bank Transfer">Bank Online Transfer</option>
									<option value="Cheque">Cheque</option>
								</select>
							</div>
							<div>
								<label className="text-[11px] font-semibold text-muted-foreground block mb-1">
									Ref / Cheque #
								</label>
								<Input
									placeholder="e.g. TR-9821 / CHQ-104"
									value={refNumber}
									onChange={(e) => setRefNumber(e.target.value)}
									className="h-8 text-xs"
								/>
							</div>
						</div>
						<div className="flex items-center justify-between gap-2 pt-1">
							<Input
								placeholder="Payment remarks or note (optional)..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="h-8 text-xs flex-1"
							/>
							<Button
								type="submit"
								size="sm"
								disabled={isSubmittingPayment || !payAmount}
								className="h-8 text-xs font-bold gap-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
							>
								{isSubmittingPayment && <Loader2 className="size-3 animate-spin" />}
								Save Payment
							</Button>
						</div>
					</form>
				)}

				{/* Transactions Table */}
				<div className="flex-1 overflow-y-auto p-4">
					{isLoading ? (
						<div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
							<Loader2 className="size-6 animate-spin text-primary" />
							<span>Loading vendor transactions...</span>
						</div>
					) : transactions.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground text-xs space-y-1">
							<Receipt className="size-8 mx-auto opacity-30" />
							<p className="font-medium">No ledger transactions yet.</p>
							<p className="text-[11px]">
								Purchases recorded for this vendor will automatically appear here.
							</p>
						</div>
					) : (
						<div className="rounded-xl border overflow-hidden">
							<table className="w-full text-xs text-left">
								<thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
									<tr>
										<th className="py-2 px-3">Date</th>
										<th className="py-2 px-3">Type</th>
										<th className="py-2 px-3">Description</th>
										<th className="py-2 px-3 text-right">Amount (PKR)</th>
										<th className="py-2 px-3 text-right">Balance After</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{transactions.map((tx) => {
										const isBill = tx.transactionType === "BILL";
										return (
											<tr key={tx.id} className="hover:bg-muted/20">
												<td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap text-muted-foreground">
													{new Date(tx.transactionDate).toLocaleDateString("en-GB", {
														day: "2-digit",
														month: "short",
														year: "numeric",
													})}
												</td>
												<td className="py-2 px-3 whitespace-nowrap">
													<span
														className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
															isBill
																? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
																: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
														}`}
													>
														{isBill ? (
															<>
																<ArrowUpRight className="size-2.5" />
																Bill (Payable +)
															</>
														) : (
															<>
																<ArrowDownLeft className="size-2.5" />
																Payment (-)
															</>
														)}
													</span>
												</td>
												<td className="py-2 px-3">
													<div className="font-medium text-foreground text-xs">
														{tx.description}
													</div>
													{tx.referenceNumber && (
														<span className="text-[10px] text-muted-foreground">
															Ref: {tx.referenceNumber}
														</span>
													)}
												</td>
												<td
													className={`py-2 px-3 text-right font-mono font-bold whitespace-nowrap ${
														isBill ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
													}`}
												>
													{isBill ? "+" : "-"} Rs. {tx.amount.toLocaleString()}
												</td>
												<td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap text-foreground">
													Rs. {tx.balanceAfter.toLocaleString()}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs">
					<span className="text-muted-foreground text-[11px]">
						Total Transactions: <strong>{transactions.length}</strong>
					</span>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onClose}
						className="h-7 text-xs cursor-pointer"
					>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
