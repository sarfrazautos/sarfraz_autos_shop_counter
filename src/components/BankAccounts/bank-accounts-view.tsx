"use client";

import { useState, useEffect, useMemo } from "react";
import {
	Landmark,
	Plus,
	Search,
	Copy,
	Check,
	Edit2,
	Trash2,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Smartphone,
	Building,
	CreditCard,
	ShieldCheck,
	RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	fetchBankAccounts,
	createBankAccount,
	updateBankAccount,
	deleteBankAccount,
	type BankAccountItem,
} from "@/lib/api/bank-accounts/bank-accounts-api";

const PRESET_BANKS = [
	"Meezan Bank",
	"Habib Bank Limited (HBL)",
	"Bank Alfalah",
	"MCB Bank",
	"Allied Bank (ABL)",
	"United Bank Limited (UBL)",
	"Faysal Bank",
	"Askari Bank",
	"Dubai Islamic Bank",
	"Standard Chartered",
	"JazzCash Merchant",
	"EasyPaisa Account",
	"Nayapay / Sadapay",
];

export function BankAccountsView() {
	const [accounts, setAccounts] = useState<BankAccountItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [copiedId, setCopiedId] = useState<string | null>(null);

	// Dialog states
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingAccount, setEditingAccount] = useState<BankAccountItem | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	// Delete Confirmation state
	const [deleteTarget, setDeleteTarget] = useState<BankAccountItem | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Form values
	const [formData, setFormData] = useState({
		bankName: "",
		accountTitle: "",
		accountNumber: "",
		branchName: "",
		iban: "",
		isActive: true,
		notes: "",
	});

	// Load Accounts
	const loadAccounts = async () => {
		try {
			setIsLoading(true);
			const res = await fetchBankAccounts();
			if (res.success && Array.isArray(res.data)) {
				setAccounts(res.data);
			}
		} catch (err: any) {
			console.error("Failed to load accounts:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadAccounts();
	}, []);

	// Filtered accounts
	const filteredAccounts = useMemo(() => {
		const q = searchQuery.toLowerCase().trim();
		if (!q) return accounts;
		return accounts.filter(
			(a) =>
				a.bankName.toLowerCase().includes(q) ||
				a.accountTitle.toLowerCase().includes(q) ||
				a.accountNumber.toLowerCase().includes(q) ||
				(a.branchName && a.branchName.toLowerCase().includes(q))
		);
	}, [accounts, searchQuery]);

	// Active count
	const activeCount = useMemo(() => accounts.filter((a) => a.isActive).length, [accounts]);

	// Open dialog for new account
	const handleOpenNew = () => {
		setEditingAccount(null);
		setFormData({
			bankName: "Meezan Bank",
			accountTitle: "Sarfraz Autos",
			accountNumber: "",
			branchName: "Saddar Branch Karachi",
			iban: "",
			isActive: true,
			notes: "",
		});
		setErrorMessage("");
		setIsDialogOpen(true);
	};

	// Open dialog for edit
	const handleOpenEdit = (acc: BankAccountItem) => {
		setEditingAccount(acc);
		setFormData({
			bankName: acc.bankName,
			accountTitle: acc.accountTitle,
			accountNumber: acc.accountNumber,
			branchName: acc.branchName || "",
			iban: acc.iban || "",
			isActive: acc.isActive,
			notes: acc.notes || "",
		});
		setErrorMessage("");
		setIsDialogOpen(true);
	};

	// Save or Update
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.bankName.trim() || !formData.accountTitle.trim() || !formData.accountNumber.trim()) {
			setErrorMessage("Bank name, account title, and account number are required.");
			return;
		}

		try {
			setIsSubmitting(true);
			setErrorMessage("");

			if (editingAccount) {
				const res = await updateBankAccount({
					id: editingAccount.id,
					...formData,
				});
				if (res.success) {
					setIsDialogOpen(false);
					await loadAccounts();
				}
			} else {
				const res = await createBankAccount(formData);
				if (res.success) {
					setIsDialogOpen(false);
					await loadAccounts();
				}
			}
		} catch (err: any) {
			setErrorMessage(err.message || "Failed to save bank account");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Toggle active/inactive directly
	const handleToggleActive = async (acc: BankAccountItem) => {
		try {
			const updatedStatus = !acc.isActive;
			setAccounts((prev) =>
				prev.map((a) => (a.id === acc.id ? { ...a, isActive: updatedStatus } : a))
			);
			await updateBankAccount({ id: acc.id, isActive: updatedStatus });
		} catch (err) {
			console.error("Toggle error:", err);
			loadAccounts();
		}
	};

	// Confirm delete
	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		try {
			setIsDeleting(true);
			await deleteBankAccount(deleteTarget.id);
			setDeleteTarget(null);
			await loadAccounts();
		} catch (err: any) {
			alert(err.message || "Failed to delete account");
		} finally {
			setIsDeleting(false);
		}
	};

	// Copy account number helper
	const handleCopy = (text: string, id: string) => {
		navigator.clipboard.writeText(text);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Top Hero Banner */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<Landmark className="size-6 text-primary" />
						Bank Accounts & Payment Channels
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-1">
						Manage receiving bank accounts and mobile wallets. Active accounts automatically appear on the Counter POS for online & split payments.
					</p>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<Button
						variant="outline"
						size="sm"
						onClick={loadAccounts}
						disabled={isLoading}
						className="h-9 gap-1.5 text-xs cursor-pointer"
						title="Refresh accounts list"
					>
						<RotateCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
						Refresh
					</Button>
					<Button
						onClick={handleOpenNew}
						size="sm"
						className="h-9 gap-1.5 text-xs font-semibold shadow-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
					>
						<Plus className="size-4" />
						Add Bank Account
					</Button>
				</div>
			</div>

			{/* Metric KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div className="rounded-xl border bg-card p-4 shadow-2xs flex items-center justify-between">
					<div>
						<span className="text-xs font-medium text-muted-foreground block">Active Receiving Channels</span>
						<span className="text-2xl font-black font-mono text-foreground mt-0.5 block">
							{activeCount} <span className="text-xs font-normal text-muted-foreground">/ {accounts.length} total</span>
						</span>
					</div>
					<div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
						<ShieldCheck className="size-5" />
					</div>
				</div>

				<div className="rounded-xl border bg-card p-4 shadow-2xs flex items-center justify-between">
					<div>
						<span className="text-xs font-medium text-muted-foreground block">Counter POS Integration</span>
						<span className="text-sm font-bold text-foreground mt-1 block flex items-center gap-1.5">
							<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
							Online & Split Live
						</span>
					</div>
					<div className="size-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600">
						<CreditCard className="size-5" />
					</div>
				</div>

				<div className="rounded-xl border bg-card p-4 shadow-2xs flex items-center justify-between">
					<div>
						<span className="text-xs font-medium text-muted-foreground block">Digital Wallets & QR</span>
						<span className="text-sm font-bold text-foreground mt-1 block">
							JazzCash / EasyPaisa
						</span>
					</div>
					<div className="size-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
						<Smartphone className="size-5" />
					</div>
				</div>
			</div>

			{/* Search Filter Bar */}
			<div className="flex items-center justify-between gap-3 bg-muted/30 p-2.5 rounded-xl border">
				<div className="relative flex-1 max-w-md">
					<Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
					<Input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search bank name, title, or account number..."
						className="h-8 pl-9 text-xs bg-background"
					/>
				</div>
				<span className="text-xs text-muted-foreground font-medium hidden sm:inline">
					Showing {filteredAccounts.length} accounts
				</span>
			</div>

			{/* Accounts Cards Grid */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[1, 2, 3].map((n) => (
						<div key={n} className="h-44 rounded-2xl border bg-card animate-pulse p-4 space-y-3" />
					))}
				</div>
			) : filteredAccounts.length === 0 ? (
				<div className="rounded-2xl border border-dashed p-12 text-center space-y-3 bg-muted/10">
					<Landmark className="size-10 mx-auto text-muted-foreground opacity-40" />
					<h3 className="font-bold text-sm text-foreground">No Bank Accounts Found</h3>
					<p className="text-xs text-muted-foreground max-w-sm mx-auto">
						{searchQuery
							? `No accounts matching "${searchQuery}". Try a different keyword.`
							: "No bank accounts added yet. Click 'Add Bank Account' to configure receiving accounts."}
					</p>
					{searchQuery ? (
						<Button variant="outline" size="xs" onClick={() => setSearchQuery("")}>
							Clear Search
						</Button>
					) : (
						<Button onClick={handleOpenNew} size="xs" className="gap-1">
							<Plus className="size-3.5" /> Add First Account
						</Button>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredAccounts.map((acc) => {
						const isWallet =
							acc.bankName.toLowerCase().includes("jazz") ||
							acc.bankName.toLowerCase().includes("easy") ||
							acc.bankName.toLowerCase().includes("naya") ||
							acc.bankName.toLowerCase().includes("sada");

						return (
							<div
								key={acc.id}
								className={`rounded-2xl border p-4 bg-card shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
									acc.isActive
										? "border-border hover:border-primary/40"
										: "border-border/60 bg-muted/20 opacity-75"
								}`}
							>
								{/* Card Header: Icon, Bank Name, Active Badge */}
								<div className="space-y-3">
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2.5">
											<div
												className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${
													isWallet
														? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
														: "bg-primary/10 border-primary/30 text-primary"
												}`}
											>
												{isWallet ? <Smartphone className="size-5" /> : <Building className="size-5" />}
											</div>
											<div>
												<h3 className="font-bold text-sm text-foreground leading-tight">
													{acc.bankName}
												</h3>
												<span className="text-[11px] text-muted-foreground font-medium">
													{acc.branchName || "Main Commercial"}
												</span>
											</div>
										</div>

										<button
											type="button"
											onClick={() => handleToggleActive(acc)}
											className="cursor-pointer focus:outline-none"
											title={acc.isActive ? "Click to deactivate" : "Click to activate"}
										>
											{acc.isActive ? (
												<Badge className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-[10px] font-bold">
													<CheckCircle2 className="size-3 text-emerald-600" />
													Active
												</Badge>
											) : (
												<Badge variant="outline" className="text-muted-foreground gap-1 text-[10px]">
													<XCircle className="size-3 text-muted-foreground" />
													Inactive
												</Badge>
											)}
										</button>
									</div>

									{/* Account Details Box */}
									<div className="rounded-xl bg-muted/40 p-3 border space-y-2">
										<div>
											<span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
												Account Title
											</span>
											<span className="text-xs font-bold text-foreground block">
												{acc.accountTitle}
											</span>
										</div>

										<div className="flex items-center justify-between pt-1 border-t border-border/40">
											<div>
												<span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
													Account Number
												</span>
												<span className="font-mono text-xs font-black text-foreground tracking-wide block">
													{acc.accountNumber}
												</span>
											</div>
											<button
												type="button"
												onClick={() => handleCopy(acc.accountNumber, acc.id)}
												className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
												title="Copy Account Number"
											>
												{copiedId === acc.id ? (
													<Check className="size-3.5 text-emerald-600" />
												) : (
													<Copy className="size-3.5" />
												)}
											</button>
										</div>

										{acc.iban && (
											<div className="pt-1 border-t border-border/40">
												<span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
													IBAN
												</span>
												<span className="font-mono text-[11px] font-medium text-muted-foreground break-all block">
													{acc.iban}
												</span>
											</div>
										)}
									</div>

									{acc.notes && (
										<p className="text-[11px] text-muted-foreground italic px-1">
											"{acc.notes}"
										</p>
									)}
								</div>

								{/* Card Footer Actions */}
								<div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40">
									<span className="text-[10px] font-mono text-muted-foreground">
										ID: {acc.id}
									</span>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="xs"
											onClick={() => handleOpenEdit(acc)}
											className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
											title="Edit details"
										>
											<Edit2 className="size-3 mr-1" />
											Edit
										</Button>
										<Button
											variant="ghost"
											size="xs"
											onClick={() => setDeleteTarget(acc)}
											className="h-7 px-2 text-xs text-muted-foreground hover:text-rose-600 cursor-pointer"
											title="Delete account"
										>
											<Trash2 className="size-3 mr-1" />
											Delete
										</Button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* ADD / EDIT DIALOG MODAL */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-[480px]">
					<DialogHeader>
						<DialogTitle className="text-base font-bold flex items-center gap-2">
							<Landmark className="size-5 text-primary" />
							{editingAccount ? "Edit Bank Account" : "Add New Bank Account"}
						</DialogTitle>
						<DialogDescription className="text-xs">
							Enter the bank account or mobile wallet credentials for receiving customer online & split payments.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-3.5 py-2">
						{errorMessage && (
							<div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
								<AlertCircle className="size-4 shrink-0" />
								<span>{errorMessage}</span>
							</div>
						)}

						{/* Bank Name with Presets */}
						<div className="space-y-1">
							<Label htmlFor="bankName" className="text-xs font-semibold">
								Bank / Wallet Name *
							</Label>
							<div className="space-y-1.5">
								<Input
									id="bankName"
									list="preset-banks-list"
									value={formData.bankName}
									onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
									placeholder="e.g. Meezan Bank, HBL, JazzCash"
									className="h-8 text-xs font-semibold"
									required
								/>
								<datalist id="preset-banks-list">
									{PRESET_BANKS.map((b) => (
										<option key={b} value={b} />
									))}
								</datalist>
								<div className="flex flex-wrap gap-1">
									{["Meezan Bank", "HBL", "Bank Alfalah", "JazzCash"].map((preset) => (
										<button
											key={preset}
											type="button"
											onClick={() => setFormData({ ...formData, bankName: preset })}
											className="text-[10px] px-2 py-0.5 rounded-full border bg-muted/60 hover:bg-muted text-foreground cursor-pointer transition-colors"
										>
											+ {preset}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Account Title */}
						<div className="space-y-1">
							<Label htmlFor="accountTitle" className="text-xs font-semibold">
								Account Title (Holder Name) *
							</Label>
							<Input
								id="accountTitle"
								value={formData.accountTitle}
								onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
								placeholder="e.g. Sarfraz Autos or Muhammad Sarfraz"
								className="h-8 text-xs"
								required
							/>
						</div>

						{/* Account Number & Branch Name */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label htmlFor="accountNumber" className="text-xs font-semibold">
									Account Number / Till ID *
								</Label>
								<Input
									id="accountNumber"
									value={formData.accountNumber}
									onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
									placeholder="0102-0105488172"
									className="h-8 text-xs font-mono font-bold"
									required
								/>
							</div>

							<div className="space-y-1">
								<Label htmlFor="branchName" className="text-xs font-semibold">
									Branch / City Name
								</Label>
								<Input
									id="branchName"
									value={formData.branchName}
									onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
									placeholder="e.g. Saddar Karachi"
									className="h-8 text-xs"
								/>
							</div>
						</div>

						{/* IBAN */}
						<div className="space-y-1">
							<Label htmlFor="iban" className="text-xs font-semibold">
								IBAN (Optional)
							</Label>
							<Input
								id="iban"
								value={formData.iban}
								onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
								placeholder="PK36MEZN0001020105488172"
								className="h-8 text-xs font-mono uppercase"
							/>
						</div>

						{/* Notes */}
						<div className="space-y-1">
							<Label htmlFor="notes" className="text-xs font-semibold">
								Remarks / Purpose (Optional)
							</Label>
							<Input
								id="notes"
								value={formData.notes}
								onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
								placeholder="e.g. Primary wholesale counter collection account"
								className="h-8 text-xs"
							/>
						</div>

						{/* Active Status Checkbox */}
						<div className="flex items-center gap-2 pt-1">
							<input
								type="checkbox"
								id="isActive"
								checked={formData.isActive}
								onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
								className="size-4 rounded text-primary focus:ring-primary cursor-pointer"
							/>
							<Label htmlFor="isActive" className="text-xs font-medium cursor-pointer">
								Active for Counter POS selection
							</Label>
						</div>

						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsDialogOpen(false)}
								disabled={isSubmitting}
								className="h-8 text-xs cursor-pointer"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								size="sm"
								disabled={isSubmitting}
								className="h-8 text-xs font-semibold cursor-pointer"
							>
								{isSubmitting ? "Saving..." : editingAccount ? "Update Account" : "Add Account"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* DELETE CONFIRMATION DIALOG */}
			<Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-[400px]">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
							<AlertCircle className="size-5" />
							Delete Bank Account?
						</DialogTitle>
						<DialogDescription className="text-xs">
							Are you sure you want to remove <strong>{deleteTarget?.bankName}</strong> ({deleteTarget?.accountNumber})? Existing completed orders will preserve their historical records.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="pt-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDeleteTarget(null)}
							disabled={isDeleting}
							className="h-8 text-xs cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleConfirmDelete}
							disabled={isDeleting}
							className="h-8 text-xs font-semibold cursor-pointer"
						>
							{isDeleting ? "Deleting..." : "Yes, Delete Account"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
