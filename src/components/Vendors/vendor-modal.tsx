"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Building2, Phone, Mail, MapPin, User, Loader2 } from "lucide-react";
import type { VendorProfile } from "./types";

interface VendorModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (vendorData: Partial<VendorProfile>) => Promise<void>;
	vendorToEdit?: VendorProfile | null;
}

export function VendorModal({ isOpen, onClose, onSave, vendorToEdit }: VendorModalProps) {
	const [name, setName] = useState("");
	const [contactPerson, setContactPerson] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [city, setCity] = useState("Karachi");
	const [address, setAddress] = useState("");
	const [openingBalance, setOpeningBalance] = useState<number>(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (vendorToEdit) {
			setName(vendorToEdit.name || "");
			setContactPerson(vendorToEdit.contactPerson || "");
			setPhone(vendorToEdit.phone || "");
			setEmail(vendorToEdit.email || "");
			setCity(vendorToEdit.city || "Karachi");
			setAddress(vendorToEdit.address || "");
			setOpeningBalance(vendorToEdit.openingBalance || 0);
		} else {
			setName("");
			setContactPerson("");
			setPhone("");
			setEmail("");
			setCity("Karachi");
			setAddress("");
			setOpeningBalance(0);
		}
		setError(null);
	}, [vendorToEdit, isOpen]);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setError("Vendor name is required");
			return;
		}
		if (!phone.trim()) {
			setError("Vendor phone number is required");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			await onSave({
				name: name.trim(),
				contactPerson: contactPerson.trim() || undefined,
				phone: phone.trim(),
				email: email.trim() || undefined,
				city: city.trim() || "Karachi",
				address: address.trim() || undefined,
				openingBalance: openingBalance || 0,
			});
			onClose();
		} catch (err: any) {
			setError(err.message || "Failed to save vendor");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
			onClick={onClose}
		>
			<div
				className="bg-card border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="p-4 border-b flex items-center justify-between bg-muted/30">
					<div className="flex items-center gap-2.5">
						<div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
							<Building2 className="size-4" />
						</div>
						<div>
							<h3 className="font-heading font-bold text-sm text-foreground">
								{vendorToEdit ? "Edit Vendor / Supplier" : "Add New Vendor / Supplier"}
							</h3>
							<p className="text-[11px] text-muted-foreground">
								{vendorToEdit
									? `Updating ${vendorToEdit.name}`
									: "Enter vendor details to record purchases and maintain ledger"}
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

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-5 space-y-4">
					{error && (
						<div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
							{error}
						</div>
					)}

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
						{/* Vendor Name */}
						<div className="sm:col-span-2 space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Building2 className="size-3 text-muted-foreground" />
								Vendor Company Name *
							</label>
							<Input
								placeholder="e.g. Crown Lifan Pakistan Ltd"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="h-9 text-xs"
								required
							/>
						</div>

						{/* Contact Person */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<User className="size-3 text-muted-foreground" />
								Contact Person
							</label>
							<Input
								placeholder="e.g. Tariq Manager"
								value={contactPerson}
								onChange={(e) => setContactPerson(e.target.value)}
								className="h-9 text-xs"
							/>
						</div>

						{/* Phone */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Phone className="size-3 text-muted-foreground" />
								Phone Number *
							</label>
							<Input
								placeholder="e.g. 0321-1234567"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								className="h-9 text-xs"
								required
							/>
						</div>

						{/* Email */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Mail className="size-3 text-muted-foreground" />
								Email Address
							</label>
							<Input
								type="email"
								placeholder="vendor@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="h-9 text-xs"
							/>
						</div>

						{/* City */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<MapPin className="size-3 text-muted-foreground" />
								City
							</label>
							<Input
								placeholder="e.g. Karachi / Lahore"
								value={city}
								onChange={(e) => setCity(e.target.value)}
								className="h-9 text-xs"
							/>
						</div>

						{/* Full Address */}
						<div className="sm:col-span-2 space-y-1.5">
							<label className="text-xs font-semibold text-foreground">
								Office / Factory Address
							</label>
							<Input
								placeholder="Plot #, Street, Industrial Area..."
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								className="h-9 text-xs"
							/>
						</div>

						{/* Opening Balance (Only for new vendors) */}
						{!vendorToEdit && (
							<div className="sm:col-span-2 space-y-1.5">
								<label className="text-xs font-semibold text-foreground">
									Initial Opening Balance Payable (Rs.)
								</label>
								<Input
									type="number"
									placeholder="0"
									value={openingBalance || ""}
									onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
									className="h-9 text-xs font-mono"
								/>
								<span className="text-[10px] text-muted-foreground block">
									Agar pehle se vendor ko kuch raqam ada karni hai to yahan darj karein.
								</span>
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="pt-3 border-t flex items-center justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onClose}
							disabled={isSubmitting}
							className="text-xs cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={isSubmitting}
							className="text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground"
						>
							{isSubmitting && <Loader2 className="size-3 animate-spin" />}
							{vendorToEdit ? "Update Vendor" : "Save Vendor"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
