"use client";

import { useState, useMemo } from "react";
import {
	BookOpen,
	Search,
	Calendar,
	Plus,
	Printer,
	Share2,
	MessageCircle,
	ArrowUpRight,
	ArrowDownLeft,
	CreditCard,
	Building2,
	Phone,
	MapPin,
	UserCheck,
	Filter,
	FileText,
	CheckCircle2,
	PlusCircle,
	AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	INITIAL_LEDGER_ACCOUNTS,
	type CustomerLedgerAccount,
	type LedgerTransaction,
} from "./types";

export function LedgerView() {
	const [accounts, setAccounts] = useState<CustomerLedgerAccount[]>(INITIAL_LEDGER_ACCOUNTS);
	const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
		INITIAL_LEDGER_ACCOUNTS[0].id
	);
	const [searchFilter, setSearchFilter] = useState("");
	const [dateFrom, setDateFrom] = useState("2026-11-01");
	const [dateTo, setDateTo] = useState("2026-11-14");

	// Recovery payment modal state
	const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
	const [recoveryAmount, setRecoveryAmount] = useState<number>(10000);
	const [recoveryCollector, setRecoveryCollector] = useState("Tariq Mehmood");
	const [recoveryMode, setRecoveryMode] = useState<"Cash Recovery" | "Bank Transfer">("Cash Recovery");
	const [recoveryNotes, setRecoveryNotes] = useState("");

	// Opening Balance modal state
	const [isOpeningBalOpen, setIsOpeningBalOpen] = useState(false);
	const [newOpeningBal, setNewOpeningBal] = useState<number>(45000);

	// Success toast/flash
	const [notice, setNotice] = useState<string | null>(null);
	const showNotice = (msg: string) => {
		setNotice(msg);
		setTimeout(() => setNotice(null), 3500);
	};

	// Active Account
	const currentAccount = useMemo(() => {
		return accounts.find((a) => a.id === selectedCustomerId) || accounts[0];
	}, [accounts, selectedCustomerId]);

	// Filtered transactions
	const filteredTransactions = useMemo(() => {
		return currentAccount.transactions.filter((tx) => {
			const matchesSearch =
				!searchFilter.trim() ||
				tx.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
				tx.voucherNo.toLowerCase().includes(searchFilter.toLowerCase()) ||
				tx.type.toLowerCase().includes(searchFilter.toLowerCase());
			return matchesSearch;
		});
	}, [currentAccount, searchFilter]);

	// Financial Summary for Selected Customer
	const totalDebits = useMemo(() => {
		return currentAccount.transactions.reduce((sum, tx) => sum + tx.debit, 0);
	}, [currentAccount]);

	const totalCredits = useMemo(() => {
		return currentAccount.transactions.reduce((sum, tx) => sum + tx.credit, 0);
	}, [currentAccount]);

	// Credit limit utilization %
	const creditPercent = useMemo(() => {
		if (!currentAccount.creditLimit) return 0;
		return Math.min(100, Math.round((currentAccount.currentBalance / currentAccount.creditLimit) * 100));
	}, [currentAccount]);

	// Record Recovery Handler
	const handleSaveRecovery = () => {
		if (recoveryAmount <= 0) {
			alert("Please enter a valid recovery amount.");
			return;
		}

		const newBalance = currentAccount.currentBalance - recoveryAmount;
		const newTx: LedgerTransaction = {
			id: `TX-${Date.now()}`,
			date: new Date().toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
			voucherNo: `REC-SAD-${Math.floor(100 + Math.random() * 900)}`,
			type: recoveryMode,
			description: recoveryNotes.trim()
				? recoveryNotes
				: `Payment collected by ${recoveryCollector}`,
			debit: 0,
			credit: recoveryAmount,
			balance: newBalance,
			collectorOrCashier: recoveryCollector,
		};

		setAccounts((prev) =>
			prev.map((acc) => {
				if (acc.id === currentAccount.id) {
					return {
						...acc,
						currentBalance: newBalance,
						lastPaymentDate: "Today",
						transactions: [...acc.transactions, newTx],
					};
				}
				return acc;
			})
		);

		setIsRecoveryOpen(false);
		setRecoveryNotes("");
		showNotice(`Recorded Rs. ${recoveryAmount.toLocaleString()} payment from ${currentAccount.name}`);
	};

	// Save Opening Balance Handler
	const handleSaveOpeningBalance = () => {
		setAccounts((prev) =>
			prev.map((acc) => {
				if (acc.id === currentAccount.id) {
					const diff = newOpeningBal - acc.openingBalance;
					const updatedTransactions = acc.transactions.map((tx) =>
						tx.type === "Opening Balance"
							? { ...tx, debit: newOpeningBal, balance: newOpeningBal }
							: { ...tx, balance: tx.balance + diff }
					);
					return {
						...acc,
						openingBalance: newOpeningBal,
						currentBalance: acc.currentBalance + diff,
						transactions: updatedTransactions,
					};
				}
				return acc;
			})
		);
		setIsOpeningBalOpen(false);
		showNotice(`Updated opening balance to Rs. ${newOpeningBal.toLocaleString()}`);
	};

	// WhatsApp Statement Share
	const handleWhatsAppStatement = () => {
		let rawPhone = (currentAccount.phone || "").replace(/[^0-9]/g, "");
		if (rawPhone.startsWith("0")) rawPhone = "92" + rawPhone.slice(1);

		const msg =
			`*SARFRAZ AUTOS (SHAHMIR) — CUSTOMER KHATA STATEMENT*\n` +
			`━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
			`*Customer:* ${currentAccount.name}\n` +
			`*Market/Route:* ${currentAccount.route} (${currentAccount.city})\n` +
			`*Recovery Officer:* ${currentAccount.salesman}\n` +
			`*Statement Date:* ${new Date().toLocaleDateString("en-GB")}\n\n` +
			`*Opening Balance:* Rs. ${currentAccount.openingBalance.toLocaleString()}\n` +
			`*Total Purchases (Dr):* Rs. ${totalDebits.toLocaleString()}\n` +
			`*Total Payments (Cr):* Rs. ${totalCredits.toLocaleString()}\n` +
			`━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
			`*NET OUTSTANDING DUES:* Rs. ${currentAccount.currentBalance.toLocaleString()}\n` +
			`━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
			`Kindly clear outstanding dues at your earliest convenience.\n` +
			`_Sarfraz Autos, Saddar Auto Market, Karachi — 0333-1285556_`;

		window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`, "_blank");
	};

	return (
		<div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-16">
			{/* NOTICE FLASH */}
			{notice && (
				<div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
					<CheckCircle2 className="size-4 text-emerald-600" />
					<span>{notice}</span>
				</div>
			)}

			{/* HEADER & SELECTOR BAR */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<BookOpen className="size-6" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="font-heading font-black text-lg sm:text-xl text-foreground">
								Customer Khata & Ledgers
							</h1>
							<Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
								Legacy Parity: Planet System
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5">
							Running customer accounts, debit/credit vouchers, opening balances, and statements.
						</p>
					</div>
				</div>

				{/* Customer Account Picker */}
				<div className="flex flex-col sm:flex-row sm:items-center gap-3">
					<div className="w-full sm:w-80">
						<Select
							value={selectedCustomerId}
							onValueChange={(val) => {
								if (val) setSelectedCustomerId(val);
							}}
						>
							<SelectTrigger className="h-9 text-xs sm:text-sm font-bold w-full bg-background border-input">
								<SelectValue placeholder="Select Customer Ledger..." />
							</SelectTrigger>
							<SelectContent>
								{accounts.map((acc) => (
									<SelectItem key={acc.id} value={acc.id} className="text-xs font-medium">
										<div className="flex items-center justify-between gap-4 w-full">
											<span className="font-bold">{acc.name}</span>
											<span className="text-[11px] font-mono text-muted-foreground">
												Rs. {acc.currentBalance.toLocaleString()}
											</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-center gap-2">
						<Button
							size="sm"
							onClick={() => setIsRecoveryOpen(true)}
							className="h-9 px-3 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
						>
							<Plus className="size-3.5" />
							Record Recovery
						</Button>

						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								setNewOpeningBal(currentAccount.openingBalance);
								setIsOpeningBalOpen(true);
							}}
							className="h-9 px-3 gap-1.5 text-xs font-semibold cursor-pointer"
						>
							<PlusCircle className="size-3.5 text-muted-foreground" />
							Opening Bal
						</Button>
					</div>
				</div>
			</div>

			{/* CUSTOMER PROFILE HEADER CARD */}
			<div className="rounded-2xl border bg-gradient-to-r from-card to-muted/20 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="space-y-1.5">
					<div className="flex items-center gap-2.5">
						<h2 className="text-xl font-heading font-black text-foreground">
							{currentAccount.name}
						</h2>
						<Badge variant="secondary" className="text-xs font-bold font-mono">
							{currentAccount.id}
						</Badge>
					</div>
					<div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
						<span className="flex items-center gap-1.5 font-medium">
							<MapPin className="size-3.5 text-primary" />
							Route: <strong className="text-foreground">{currentAccount.route}</strong> ({currentAccount.city})
						</span>
						<span className="flex items-center gap-1.5 font-medium">
							<UserCheck className="size-3.5 text-emerald-600" />
							Recovery Officer: <strong className="text-foreground">{currentAccount.salesman}</strong>
						</span>
						<span className="flex items-center gap-1.5 font-medium">
							<Phone className="size-3.5 text-muted-foreground" />
							{currentAccount.phone}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<Button
						variant="outline"
						size="sm"
						onClick={handleWhatsAppStatement}
						className="h-8 px-3 gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-xs font-semibold cursor-pointer"
					>
						<MessageCircle className="size-3.5 text-emerald-600" />
						WhatsApp Statement
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => window.print()}
						className="h-8 px-3 gap-1.5 text-xs font-semibold cursor-pointer"
					>
						<Printer className="size-3.5" />
						Print Ledger
					</Button>
				</div>
			</div>

			{/* 4 KPI SUMMARY CARDS */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Opening Balance */}
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
						Opening Balance (Old Dues)
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl font-mono font-black text-foreground">
							Rs. {currentAccount.openingBalance.toLocaleString()}
						</span>
						<Badge variant="outline" className="text-[10px] font-mono">
							Brought Forward
						</Badge>
					</div>
					<p className="text-[11px] text-muted-foreground">Historical debt from old ledger book</p>
				</div>

				{/* Total Invoiced (Debits) */}
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
						Total Invoiced (Debits +)
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">
							Rs. {totalDebits.toLocaleString()}
						</span>
						<ArrowUpRight className="size-4 text-rose-600" />
					</div>
					<p className="text-[11px] text-muted-foreground">New spare parts billed to account</p>
				</div>

				{/* Total Recovered (Credits) */}
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
						Total Recovered (Credits -)
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
							Rs. {totalCredits.toLocaleString()}
						</span>
						<ArrowDownLeft className="size-4 text-emerald-600" />
					</div>
					<p className="text-[11px] text-muted-foreground">Cash received by salesmen & banks</p>
				</div>

				{/* Net Outstanding Balance */}
				<div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 shadow-xs space-y-1">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
							Net Outstanding Balance
						</span>
						<Badge variant="destructive" className="text-[10px] font-mono">
							{creditPercent}% Limit
						</Badge>
					</div>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl sm:text-3xl font-mono font-black text-foreground">
							Rs. {currentAccount.currentBalance.toLocaleString()}
						</span>
					</div>
					<div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
						<div
							className={`h-full rounded-full ${
								creditPercent > 80 ? "bg-rose-500" : "bg-primary"
							}`}
							style={{ width: `${creditPercent}%` }}
						/>
					</div>
				</div>
			</div>

			{/* LEDGER TRANSACTIONS STATEMENT */}
			<div className="rounded-2xl border bg-card shadow-xs overflow-hidden flex flex-col">
				{/* Filter toolbar */}
				<div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<FileText className="size-4 text-primary" />
						<h3 className="font-heading font-bold text-sm text-foreground">
							Account Transaction Ledger
						</h3>
						<span className="text-xs text-muted-foreground">
							({filteredTransactions.length} vouchers recorded)
						</span>
					</div>

					<div className="flex items-center gap-3">
						<div className="relative w-64">
							<Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchFilter}
								onChange={(e) => setSearchFilter(e.target.value)}
								placeholder="Search voucher # or note..."
								className="h-8 text-xs pl-8 bg-background"
							/>
						</div>
					</div>
				</div>

				{/* Table Grid */}
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
							<tr>
								<th className="py-2.5 px-3.5">Date</th>
								<th className="py-2.5 px-3.5">Voucher / Bill #</th>
								<th className="py-2.5 px-3.5">Transaction Type</th>
								<th className="py-2.5 px-3.5 min-w-[220px]">Particulars / Details</th>
								<th className="py-2.5 px-3.5">Salesman / Cashier</th>
								<th className="py-2.5 px-3.5 text-right text-rose-600">Debit (Dr)</th>
								<th className="py-2.5 px-3.5 text-right text-emerald-600">Credit (Cr)</th>
								<th className="py-2.5 px-3.5 text-right font-mono font-bold">Balance (Rs.)</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{filteredTransactions.map((tx) => (
								<tr key={tx.id} className="hover:bg-muted/30 transition-colors font-mono">
									<td className="py-3 px-3.5 font-sans font-medium text-foreground whitespace-nowrap">
										{tx.date}
									</td>
									<td className="py-3 px-3.5 font-bold text-foreground whitespace-nowrap">
										{tx.voucherNo}
									</td>
									<td className="py-3 px-3.5 font-sans whitespace-nowrap">
										<Badge
											variant="outline"
											className={`text-[10px] font-semibold ${
												tx.type === "Opening Balance"
													? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
													: tx.type === "Sale Invoice"
													? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
													: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
											}`}
										>
											{tx.type}
										</Badge>
									</td>
									<td className="py-3 px-3.5 font-sans text-muted-foreground">
										{tx.description}
									</td>
									<td className="py-3 px-3.5 font-sans text-muted-foreground whitespace-nowrap">
										{tx.collectorOrCashier || "—"}
									</td>
									<td className="py-3 px-3.5 text-right font-bold text-rose-600 dark:text-rose-400">
										{tx.debit > 0 ? `Rs. ${tx.debit.toLocaleString()}` : "—"}
									</td>
									<td className="py-3 px-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
										{tx.credit > 0 ? `Rs. ${tx.credit.toLocaleString()}` : "—"}
									</td>
									<td className="py-3 px-3.5 text-right font-black text-foreground text-sm">
										Rs. {tx.balance.toLocaleString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Table Footer */}
				<div className="p-4 border-t bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold gap-2">
					<span className="text-muted-foreground">
						Showing running ledger for <strong>{currentAccount.name}</strong>
					</span>
					<div className="flex items-center gap-6 font-mono">
						<span>Total Billed: <strong className="text-rose-600 font-bold">Rs. {totalDebits.toLocaleString()}</strong></span>
						<span>Total Paid: <strong className="text-emerald-600 font-bold">Rs. {totalCredits.toLocaleString()}</strong></span>
						<span>Current Dues: <strong className="text-foreground font-black text-sm">Rs. {currentAccount.currentBalance.toLocaleString()}</strong></span>
					</div>
				</div>
			</div>

			{/* RECORD RECOVERY MODAL */}
			<Dialog open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<CreditCard className="size-5 text-emerald-600" />
							Record Payment / Cash Recovery
						</DialogTitle>
						<DialogDescription>
							Receive cash or online payment from <strong>{currentAccount.name}</strong> to reduce their khata debt.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3.5 py-2">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-muted-foreground">
								Payment Mode:
							</label>
							<Select
								value={recoveryMode}
								onValueChange={(val) => {
									if (val) setRecoveryMode(val as any);
								}}
							>
								<SelectTrigger className="h-9 text-xs w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Cash Recovery">Cash Recovery (Collected at Shop)</SelectItem>
									<SelectItem value="Bank Transfer">Bank Transfer (IBFT / Meezan Bank)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-muted-foreground">
								Recovery Collector / Officer:
							</label>
							<Select
								value={recoveryCollector}
								onValueChange={(val) => {
									if (val) setRecoveryCollector(val);
								}}
							>
								<SelectTrigger className="h-9 text-xs w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Tariq Mehmood">Tariq Mehmood (Saddar & Hyderabad)</SelectItem>
									<SelectItem value="Sarfraz Ahmed">Sarfraz Ahmed (Malir & Baluchistan)</SelectItem>
									<SelectItem value="Kashif Raza">Kashif Raza (Gulshan Counter)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-muted-foreground">
								Amount Received (PKR):
							</label>
							<Input
								type="number"
								min={1}
								value={recoveryAmount}
								onChange={(e) => setRecoveryAmount(Math.max(0, parseInt(e.target.value) || 0))}
								className="font-mono font-bold text-sm h-9"
							/>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-muted-foreground">
								Description / Remarks:
							</label>
							<Input
								value={recoveryNotes}
								onChange={(e) => setRecoveryNotes(e.target.value)}
								placeholder="e.g. Cleared bill INV-SAD-9812 via Cash"
								className="text-xs h-9"
							/>
						</div>

						<div className="rounded-xl p-3 bg-muted/50 border text-xs space-y-1">
							<div className="flex justify-between text-muted-foreground">
								<span>Current Balance:</span>
								<span className="font-mono font-bold">Rs. {currentAccount.currentBalance.toLocaleString()}</span>
							</div>
							<div className="flex justify-between text-emerald-600 font-bold">
								<span>Less Payment:</span>
								<span className="font-mono">- Rs. {recoveryAmount.toLocaleString()}</span>
							</div>
							<div className="flex justify-between border-t pt-1 font-bold text-foreground">
								<span>New Balance:</span>
								<span className="font-mono text-sm">Rs. {Math.max(0, currentAccount.currentBalance - recoveryAmount).toLocaleString()}</span>
							</div>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" size="sm" onClick={() => setIsRecoveryOpen(false)}>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveRecovery}
							className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
						>
							Save & Post Voucher
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* SET OPENING BALANCE MODAL */}
			<Dialog open={isOpeningBalOpen} onOpenChange={setIsOpeningBalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<BookOpen className="size-5 text-primary" />
							Set Customer Opening Balance
						</DialogTitle>
						<DialogDescription>
							Migrate or adjust the initial starting debt for <strong>{currentAccount.name}</strong> brought forward from legacy software or paper registers.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3.5 py-2">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-muted-foreground">
								Opening Starting Debt (Rs.):
							</label>
							<Input
								type="number"
								value={newOpeningBal}
								onChange={(e) => setNewOpeningBal(Math.max(0, parseInt(e.target.value) || 0))}
								className="font-mono font-bold text-sm h-9"
							/>
						</div>

						<p className="text-[11px] text-muted-foreground leading-relaxed">
							This will recompute historical running balance totals starting from voucher <code>OPN-2026</code>.
						</p>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" size="sm" onClick={() => setIsOpeningBalOpen(false)}>
							Cancel
						</Button>
						<Button size="sm" onClick={handleSaveOpeningBalance} className="font-bold">
							Update Opening Balance
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
