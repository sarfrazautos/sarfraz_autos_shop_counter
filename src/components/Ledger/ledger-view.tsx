"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchLedgerAccounts, addLedgerTransaction } from "@/lib/api/ledger/ledger-api";
import { updateCustomer } from "@/lib/api/customers/customers-api";
import {
	BookOpen,
	Search,
	Plus,
	Printer,
	MessageCircle,
	ArrowUpRight,
	ArrowDownLeft,
	CreditCard,
	Phone,
	MapPin,
	UserCheck,
	FileText,
	CheckCircle2,
	PlusCircle,
	ChevronsUpDown,
	X,
	Users,
	Loader2,
	UserPlus,
} from "lucide-react";
import { CustomerFormDialog } from "@/components/Customers/customer-form-dialog";
import { CustomerLedgerSkeleton } from "@/components/Skeletons";
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
import { cn } from "@/lib/utils";
import type { CustomerLedgerAccount, LedgerTransaction } from "./types";

const EMPTY_ACCOUNT: CustomerLedgerAccount = {
	id: "none",
	name: "No Customer Selected",
	phone: "--",
	city: "--",
	route: "--",
	salesman: "--",
	currentBalance: 0,
	openingBalance: 0,
	creditLimit: 0,
	lastPaymentDate: "--",
	transactions: [],
};

export function LedgerView() {
	const queryClient = useQueryClient();

	const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
	const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const handleCustomerCreated = (newCust: any) => {
		setSelectedCustomerId(newCust.id);
		setCustomerSearchTerm(newCust.name);
		setIsAddCustomerOpen(false);
		setNotice(`Customer ${newCust.name} successfully registered with Khata ledger!`);
		setTimeout(() => setNotice(null), 4000);
	};

	// Close suggestion dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// TanStack Query for customer ledger accounts & transactions
	const { data: ledgerData, isLoading } = useQuery({
		queryKey: queryKeys.ledger.accounts(selectedCustomerId || "initial"),
		queryFn: () => fetchLedgerAccounts(selectedCustomerId),
		staleTime: 1000 * 60 * 3,
	});

	// Derive accounts directly from ledgerData (no useEffect / no setAccounts infinite loop)
	const accounts = useMemo<CustomerLedgerAccount[]>(() => {
		if (!ledgerData?.data?.accounts || ledgerData.data.accounts.length === 0) {
			return [];
		}
		return ledgerData.data.accounts.map((a: any) => ({
			id: a.id,
			name: a.name || a.customerName || "Customer",
			phone: a.phone || "--",
			city: a.city || "--",
			route: a.route || "--",
			salesman: a.salesman || "--",
			openingBalance: Number(a.openingBalance || 0),
			currentBalance: Number(a.currentBalance || 0),
			creditLimit: Number(a.creditLimit || 0),
			lastPaymentDate: a.lastPaymentDate || "--",
			transactions: (a.transactions || []).map((tx: any) => ({
				id: tx.id,
				date: tx.date,
				voucherNo: tx.voucherNo || tx.voucherNumber,
				type: tx.type || tx.transactionType,
				description: tx.description,
				debit: Number(tx.debit || tx.debitAmount || 0),
				credit: Number(tx.credit || tx.creditAmount || 0),
				balance: Number(tx.balance || tx.runningBalance || 0),
				collectorOrCashier: tx.collector || tx.collectorOrCashier || "Counter Cashier",
			})),
		}));
	}, [ledgerData]);

	// Filter suggestions based on what user types
	const suggestedAccounts = useMemo(() => {
		if (!customerSearchTerm.trim()) return accounts;
		const term = customerSearchTerm.toLowerCase().trim();
		return accounts.filter(
			(acc) =>
				acc.name.toLowerCase().includes(term) ||
				acc.id.toLowerCase().includes(term) ||
				acc.phone.toLowerCase().includes(term) ||
				acc.route.toLowerCase().includes(term) ||
				acc.city.toLowerCase().includes(term)
		);
	}, [accounts, customerSearchTerm]);

	// Active Account (matches selectedCustomerId, or falls back to first account)
	const currentAccount = useMemo(() => {
		if (accounts.length === 0) return EMPTY_ACCOUNT;
		if (selectedCustomerId) {
			const found = accounts.find((a) => a.id === selectedCustomerId);
			if (found) return found;
		}
		return accounts[0] || EMPTY_ACCOUNT;
	}, [accounts, selectedCustomerId]);

	const hasSelectedAccount = accounts.length > 0 && currentAccount.id !== "none";

	// Mutation for recording payment recovery
	const recoveryMutation = useMutation({
		mutationFn: (payload: { customerId: string; amount: number; type: string; notes?: string; collector?: string }) =>
			addLedgerTransaction(payload.customerId, {
				transactionType: payload.type,
				amount: payload.amount,
				description: payload.notes,
				collectorName: payload.collector,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
		},
	});

	// Mutation for updating opening balance
	const openingBalMutation = useMutation({
		mutationFn: (payload: { customerId: string; openingBalance: number }) =>
			updateCustomer(payload.customerId, { openingBalance: payload.openingBalance }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
		},
	});

	const [searchFilter, setSearchFilter] = useState("");

	// Recovery payment modal state
	const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
	const [recoveryAmount, setRecoveryAmount] = useState<number>(10000);
	const [recoveryCollector, setRecoveryCollector] = useState("Tariq Mehmood");
	const [recoveryMode, setRecoveryMode] = useState<"Cash Recovery" | "Bank Transfer">("Cash Recovery");
	const [recoveryNotes, setRecoveryNotes] = useState("");

	// Opening Balance modal state
	const [isOpeningBalOpen, setIsOpeningBalOpen] = useState(false);
	const [newOpeningBal, setNewOpeningBal] = useState<number>(0);

	// Success toast/flash
	const [notice, setNotice] = useState<string | null>(null);
	const showNotice = (msg: string) => {
		setNotice(msg);
		setTimeout(() => setNotice(null), 3500);
	};

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

		recoveryMutation.mutate({
			customerId: currentAccount.id,
			amount: recoveryAmount,
			type: recoveryMode,
			notes: recoveryNotes.trim() ? recoveryNotes : `Payment collected by ${recoveryCollector}`,
			collector: recoveryCollector,
		});

		setIsRecoveryOpen(false);
		setRecoveryNotes("");
		showNotice(`Recorded Rs. ${recoveryAmount.toLocaleString()} payment from ${currentAccount.name}`);
	};

	// Save Opening Balance Handler
	const handleSaveOpeningBalance = async () => {
		if (newOpeningBal < 0) {
			alert("Opening balance cannot be negative.");
			return;
		}

		try {
			await openingBalMutation.mutateAsync({
				customerId: currentAccount.id,
				openingBalance: newOpeningBal,
			});
			setIsOpeningBalOpen(false);
			showNotice(`Updated opening balance to Rs. ${newOpeningBal.toLocaleString()}`);
		} catch (err: any) {
			alert(err.message || "Failed to update opening balance.");
		}
	};

	// WhatsApp Statement Share
	const handleWhatsAppStatement = () => {
		let rawPhone = (currentAccount.phone || "").replace(/[^0-9]/g, "");
		if (rawPhone.startsWith("0")) rawPhone = "92" + rawPhone.slice(1);

		const msg =
			`*SARFRAZ AUTOS — CUSTOMER KHATA STATEMENT*\n` +
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

	if (isLoading && !ledgerData) {
		return <CustomerLedgerSkeleton />;
	}

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
							<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
								Customer Khata & Ledgers
							</h1>
							<Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
								Live Ledger
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5">
							Running customer accounts, debit/credit vouchers, opening balances, and statements.
						</p>
					</div>
				</div>

				{/* Searchable Autocomplete Customer Selector */}
				<div className="flex flex-col sm:flex-row sm:items-center gap-3">
					<div className="relative w-full sm:w-80" ref={dropdownRef}>
						<div className="relative flex items-center">
							<Search className="size-4 text-muted-foreground absolute left-3 pointer-events-none" />
							<Input
								value={customerSearchTerm}
								onChange={(e) => {
									setCustomerSearchTerm(e.target.value);
									setIsDropdownOpen(true);
								}}
								onFocus={() => setIsDropdownOpen(true)}
								placeholder={currentAccount.id !== "none" ? `Selected: ${currentAccount.name}` : "Type customer name, route, or ID..."}
								className="h-9 pl-9 pr-14 text-xs font-semibold bg-background"
							/>
							<div className="absolute right-2 flex items-center gap-1">
								{isLoading && (
									<Loader2 className="size-3.5 animate-spin text-muted-foreground" />
								)}
								{(customerSearchTerm || selectedCustomerId) && (
									<button
										type="button"
										onClick={() => {
											setCustomerSearchTerm("");
											setSelectedCustomerId("");
											setIsDropdownOpen(true);
										}}
										className="p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-sm"
										title="Clear selection"
									>
										<X className="size-3.5" />
									</button>
								)}
								<button
									type="button"
									onClick={() => setIsDropdownOpen((prev) => !prev)}
									className="p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-sm"
									title="Toggle suggestions"
								>
									<ChevronsUpDown className="size-3.5" />
								</button>
							</div>
						</div>

						{/* Suggestions Popover / Dropdown Below Input */}
						{isDropdownOpen && (
							<div className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl border bg-popover text-popover-foreground shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
								{accounts.length === 0 ? (
									<div className="p-4 text-center space-y-2">
										<Users className="size-5 text-muted-foreground mx-auto mb-1" />
										<p className="text-xs font-bold text-foreground">No Customer Khata Accounts</p>
										<p className="text-[11px] text-muted-foreground leading-normal">
											The database is starting fresh from zero. Accounts will appear here automatically when customer invoices or accounts are created.
										</p>
										<Button
											type="button"
											size="sm"
											onClick={() => {
												setIsDropdownOpen(false);
												setIsAddCustomerOpen(true);
											}}
											className="h-7 px-3 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
										>
											<UserPlus className="size-3" />
											+ Register Customer
										</Button>
									</div>
								) : suggestedAccounts.length === 0 ? (
									<div className="p-3 text-center text-xs text-muted-foreground">
										No customer found matching &ldquo;{customerSearchTerm}&rdquo;
									</div>
								) : (
									<div className="max-h-60 overflow-y-auto divide-y divide-border/40 p-1">
										<div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
											Suggestions ({suggestedAccounts.length})
										</div>
										{suggestedAccounts.map((acc) => {
											const isSelected = acc.id === selectedCustomerId;
											return (
												<button
													key={acc.id}
													type="button"
													onClick={() => {
														setSelectedCustomerId(acc.id);
														setCustomerSearchTerm("");
														setIsDropdownOpen(false);
													}}
													className={cn(
														"w-full text-left p-2.5 rounded-lg transition-colors flex items-center justify-between gap-3 cursor-pointer",
														isSelected
															? "bg-primary/10 text-primary font-semibold"
															: "hover:bg-muted text-foreground"
													)}
												>
													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<span className="font-bold text-xs truncate">{acc.name}</span>
															<Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
																{acc.id}
															</Badge>
														</div>
														<p className="text-[11px] text-muted-foreground truncate mt-0.5">
															{acc.route} ({acc.city}) • {acc.phone}
														</p>
													</div>
													<div className="text-right shrink-0">
														<span className="text-xs font-mono font-bold block">
															Rs. {acc.currentBalance.toLocaleString()}
														</span>
														<span className="text-[10px] text-muted-foreground">Balance</span>
													</div>
												</button>
											);
										})}
									</div>
								)}
							</div>
						)}
					</div>

					<Button
						type="button"
						size="sm"
						onClick={() => setIsAddCustomerOpen(true)}
						className="h-9 px-3.5 gap-1.5 bg-primary text-primary-foreground font-bold text-xs cursor-pointer shadow-xs shrink-0"
					>
						<UserPlus className="size-3.5" />
						+ New Customer
					</Button>

					<div className="flex items-center gap-2">
						<Button
							size="sm"
							disabled={!hasSelectedAccount}
							onClick={() => setIsRecoveryOpen(true)}
							className="h-9 px-3 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
						>
							<Plus className="size-3.5" />
							Record Recovery
						</Button>

						<Button
							size="sm"
							variant="outline"
							disabled={!hasSelectedAccount}
							onClick={() => {
								setNewOpeningBal(currentAccount.openingBalance);
								setIsOpeningBalOpen(true);
							}}
							className="h-9 px-3 gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
						>
							<PlusCircle className="size-3.5 text-muted-foreground" />
							Opening Bal
						</Button>
					</div>
				</div>
			</div>

			{/* CUSTOMER PROFILE & TRANSACTIONS TABLE */}
			{!hasSelectedAccount ? (
				<div className="rounded-2xl border bg-card p-12 text-center space-y-4 shadow-xs">
					<div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
						<BookOpen className="size-7" />
					</div>
					<div className="space-y-1">
						<h3 className="text-base font-bold text-foreground">Customer Khata Ledger Starting From Zero</h3>
						<p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
							All static mock names, customer accounts, and dummy vouchers have been completely cleared. When you register a new customer or bill credit orders in the Counter POS, their running ledger, vouchers, and statements will appear here automatically.
						</p>
					</div>
					<Button
						type="button"
						onClick={() => setIsAddCustomerOpen(true)}
						className="h-9 px-4 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs cursor-pointer mx-auto"
					>
						<UserPlus className="size-3.5" />
						+ Register New Customer Account
					</Button>
				</div>
			) : (
				<>
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
									<Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
									{filteredTransactions.length === 0 ? (
										<tr>
											<td colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
												No transaction vouchers recorded for this customer account.
											</td>
										</tr>
									) : (
										filteredTransactions.map((tx) => (
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
										))
									)}
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
				</>
			)}

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
								placeholder="e.g. Cleared invoice balance by shop visit"
								className="text-xs h-9"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsRecoveryOpen(false)}
							className="cursor-pointer text-xs"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveRecovery}
							className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
						>
							Save & Post to Ledger
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* OPENING BALANCE MODAL */}
			<Dialog open={isOpeningBalOpen} onOpenChange={setIsOpeningBalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<PlusCircle className="size-5 text-primary" />
							Adjust Opening Balance
						</DialogTitle>
						<DialogDescription>
							Set or modify brought-forward opening dues for <strong>{currentAccount.name}</strong>.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-2">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-muted-foreground">
								Opening Balance Amount (PKR):
							</label>
							<Input
								type="number"
								value={newOpeningBal}
								onChange={(e) => setNewOpeningBal(parseInt(e.target.value) || 0)}
								className="font-mono font-bold text-sm h-9"
							/>
							<p className="text-[11px] text-muted-foreground">
								This adjusts the initial debt brought forward from legacy ledger books.
							</p>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={openingBalMutation.isPending}
							onClick={() => setIsOpeningBalOpen(false)}
							className="cursor-pointer text-xs"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveOpeningBalance}
							disabled={openingBalMutation.isPending}
							className="font-bold text-xs cursor-pointer gap-1.5"
						>
							{openingBalMutation.isPending ? (
								<>
									<Loader2 className="size-3.5 animate-spin" />
									Updating...
								</>
							) : (
								"Update Balance"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<CustomerFormDialog
				open={isAddCustomerOpen}
				onOpenChange={setIsAddCustomerOpen}
				onSuccess={handleCustomerCreated}
			/>
		</div>
	);
}
