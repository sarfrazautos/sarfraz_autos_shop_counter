"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Building2,
	Plus,
	Search,
	DollarSign,
	Users,
	TrendingUp,
	RefreshCw,
} from "lucide-react";
import { VendorTable } from "./vendor-table";
import { VendorModal } from "./vendor-modal";
import { VendorLedgerModal } from "./vendor-ledger-modal";
import type { VendorProfile } from "./types";
import Link from "next/link";

export function VendorView() {
	const [vendors, setVendors] = useState<VendorProfile[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	// Modals
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [vendorToEdit, setVendorToEdit] = useState<VendorProfile | null>(null);

	const [isLedgerOpen, setIsLedgerOpen] = useState(false);
	const [selectedVendorForLedger, setSelectedVendorForLedger] = useState<VendorProfile | null>(null);

	const fetchVendors = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/vendors?search=${encodeURIComponent(searchQuery)}`);
			const data = await res.json();
			if (data.vendors) {
				setVendors(data.vendors);
			}
		} catch (err) {
			console.error("Failed to fetch vendors:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchVendors();
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	const handleSaveVendor = async (vendorData: Partial<VendorProfile>) => {
		if (vendorToEdit) {
			const res = await fetch(`/api/vendors/${vendorToEdit.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(vendorData),
			});
			if (!res.ok) throw new Error("Failed to update vendor");
		} else {
			const res = await fetch(`/api/vendors`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(vendorData),
			});
			if (!res.ok) throw new Error("Failed to create vendor");
		}
		fetchVendors();
	};

	const totalPayable = vendors.reduce((sum, v) => sum + (v.currentBalance || 0), 0);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<Building2 className="size-6 text-primary" />
						<h1 className="font-heading font-black text-xl text-foreground">
							Suppliers & Vendors
						</h1>
					</div>
					<p className="text-xs text-muted-foreground mt-0.5">
						Manage spare parts factories, brand distributors, and supplier payment ledgers
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Link href="/dashboard/purchases/new">
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
						>
							+ Enter Purchase Bill
						</Button>
					</Link>
					<Button
						size="sm"
						onClick={() => {
							setVendorToEdit(null);
							setIsModalOpen(true);
						}}
						className="h-8 text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground shadow-xs"
					>
						<Plus className="size-3.5" />
						Add New Vendor
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{/* Total Vendors */}
				<div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-1">
					<div className="flex items-center justify-between text-muted-foreground">
						<span className="text-xs font-medium">Registered Suppliers</span>
						<Users className="size-4 text-primary" />
					</div>
					<div className="font-mono font-black text-2xl text-foreground">
						{vendors.length}
					</div>
					<p className="text-[11px] text-muted-foreground">Active supply partners</p>
				</div>

				{/* Total Payable Balance */}
				<div className="rounded-2xl border bg-card p-4 shadow-2xs space-y-1">
					<div className="flex items-center justify-between text-muted-foreground">
						<span className="text-xs font-medium">Total Balance Payable (Dues)</span>
						<DollarSign className="size-4 text-rose-500" />
					</div>
					<div className="font-mono font-black text-2xl text-rose-600 dark:text-rose-400">
						Rs. {totalPayable.toLocaleString()}
					</div>
					<p className="text-[11px] text-muted-foreground">
						Amount owed across all supplier khatas
					</p>
				</div>

				{/* Action / Quick Link */}
				<div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-2xs space-y-2 flex flex-col justify-between">
					<div className="flex items-center justify-between text-muted-foreground">
						<span className="text-xs font-medium text-foreground">Inward Stock Ingestion</span>
						<TrendingUp className="size-4 text-emerald-500" />
					</div>
					<p className="text-[11px] text-muted-foreground">
						Upload vendor Excel bill or record manual purchase to automatically restock parts.
					</p>
					<Link
						href="/dashboard/purchases/new"
						className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
					>
						Upload Excel or Add Bill →
					</Link>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className="rounded-2xl border bg-card p-3 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
				<div className="relative flex-1 min-w-[240px]">
					<Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
					<Input
						placeholder="Search vendor name, phone, contact person, or city..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 h-9 text-xs bg-background"
					/>
				</div>

				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={fetchVendors}
					className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1.5"
				>
					<RefreshCw className="size-3.5" />
					Refresh
				</Button>
			</div>

			{/* Vendor Table Card */}
			<div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
				<VendorTable
					vendors={vendors}
					isLoading={isLoading}
					onEdit={(v) => {
						setVendorToEdit(v);
						setIsModalOpen(true);
					}}
					onViewLedger={(v) => {
						setSelectedVendorForLedger(v);
						setIsLedgerOpen(true);
					}}
				/>
			</div>

			{/* Add / Edit Vendor Modal */}
			<VendorModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setVendorToEdit(null);
				}}
				onSave={handleSaveVendor}
				vendorToEdit={vendorToEdit}
			/>

			{/* Vendor Khata Ledger Modal */}
			<VendorLedgerModal
				vendor={selectedVendorForLedger}
				isOpen={isLedgerOpen}
				onClose={() => {
					setIsLedgerOpen(false);
					setSelectedVendorForLedger(null);
					fetchVendors();
				}}
			/>
		</div>
	);
}
