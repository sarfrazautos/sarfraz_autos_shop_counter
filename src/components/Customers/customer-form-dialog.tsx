"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createCustomer } from "@/lib/api/customers/customers-api";
import { queryKeys } from "@/lib/query-keys";
import type { CustomerProfile } from "@/components/Counter/types";
import { UserPlus, Loader2, AlertCircle, Building2, Phone, MapPin, Wallet, ShieldCheck } from "lucide-react";

interface CustomerFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: (newCustomer: CustomerProfile) => void;
	defaultType?: "Wholesale Dealer" | "Workshop / Mechanic" | "Retail Customer";
}

export function CustomerFormDialog({
	open,
	onOpenChange,
	onSuccess,
	defaultType = "Wholesale Dealer",
}: CustomerFormDialogProps) {
	const queryClient = useQueryClient();

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [city, setCity] = useState("Karachi");
	const [route, setRoute] = useState("Saddar Counter");
	const [customerType, setCustomerType] = useState<"Wholesale Dealer" | "Workshop / Mechanic" | "Retail Customer">(defaultType);
	const [paymentMethod, setPaymentMethod] = useState<"Credit / Khata" | "Cash on Counter">("Credit / Khata");
	const [creditLimit, setCreditLimit] = useState("50000");
	const [openingBalance, setOpeningBalance] = useState("0");

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const resetForm = () => {
		setName("");
		setPhone("");
		setCity("Karachi");
		setRoute("Saddar Counter");
		setCustomerType(defaultType);
		setPaymentMethod("Credit / Khata");
		setCreditLimit("50000");
		setOpeningBalance("0");
		setErrorMessage(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = name.trim();
		const trimmedPhone = phone.trim();

		if (!trimmedName) {
			setErrorMessage("Customer or workshop name is required.");
			return;
		}

		if (!trimmedPhone) {
			setErrorMessage("Phone number is required.");
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			const parsedCreditLimit = Math.max(0, parseFloat(creditLimit) || 0);
			const parsedOpeningBalance = Math.max(0, parseFloat(openingBalance) || 0);

			const payload = {
				name: trimmedName,
				phone: trimmedPhone,
				city: city.trim() || "Karachi",
				route: route.trim() || "Saddar Counter",
				salesman: "Counter Cashier",
				customerType,
				paymentMethod,
				creditLimit: parsedCreditLimit,
				openingBalance: parsedOpeningBalance,
			};

			const response = await createCustomer(payload);

			if (response.success && response.data) {
				const createdProfile: CustomerProfile = {
					id: response.data.id,
					name: response.data.name || trimmedName,
					phone: response.data.phone || trimmedPhone,
					city: response.data.city || city,
					route: response.data.route || route,
					salesman: response.data.salesman || "Counter Cashier",
					type: customerType,
					paymentMethod,
					openingBalance: parsedOpeningBalance,
					currentBalance: parsedOpeningBalance,
					creditLimit: parsedCreditLimit,
				};

				// Invalidate customer & ledger queries to refresh lists
				queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
				queryClient.invalidateQueries({ queryKey: queryKeys.ledger.all });

				resetForm();
				onOpenChange(false);
				if (onSuccess) {
					onSuccess(createdProfile);
				}
			} else {
				setErrorMessage(response.message || "Failed to create customer.");
			}
		} catch (err: any) {
			setErrorMessage(err.message || "An unexpected error occurred while registering the customer.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				if (!val) resetForm();
				onOpenChange(val);
			}}
		>
			<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg font-bold">
							<div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
								<UserPlus className="size-4" />
							</div>
							Register New Khata Customer
						</DialogTitle>
						<DialogDescription className="text-xs">
							Create a wholesale dealer, mechanic workshop, or credit account for Sarfraz Autos.
						</DialogDescription>
					</DialogHeader>

					{errorMessage && (
						<div className="my-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
							<AlertCircle className="size-4 shrink-0" />
							<span>{errorMessage}</span>
						</div>
					)}

					<div className="grid gap-3 py-4 text-xs">
						{/* Name & Phone */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="cust-name" className="text-xs font-semibold flex items-center gap-1">
									<Building2 className="size-3 text-muted-foreground" />
									Business / Customer Name *
								</Label>
								<Input
									id="cust-name"
									placeholder="e.g. Kashif Autos / Ali Mechanic"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
									className="h-8.5 text-xs"
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="cust-phone" className="text-xs font-semibold flex items-center gap-1">
									<Phone className="size-3 text-muted-foreground" />
									Phone Number *
								</Label>
								<Input
									id="cust-phone"
									placeholder="0300-1234567"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									required
									className="h-8.5 text-xs font-mono"
								/>
							</div>
						</div>

						{/* City & Route */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="cust-city" className="text-xs font-semibold flex items-center gap-1">
									<MapPin className="size-3 text-muted-foreground" />
									City / Market Area
								</Label>
								<Input
									id="cust-city"
									placeholder="e.g. Saddar, Ranchore Line, Karachi"
									value={city}
									onChange={(e) => setCity(e.target.value)}
									className="h-8.5 text-xs"
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="cust-route" className="text-xs font-semibold">
									Delivery Route / Counter
								</Label>
								<Input
									id="cust-route"
									placeholder="e.g. Saddar Counter"
									value={route}
									onChange={(e) => setRoute(e.target.value)}
									className="h-8.5 text-xs"
								/>
							</div>
						</div>

						{/* Customer Type & Payment Method */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Account Type</Label>
								<Select
									value={customerType}
									onValueChange={(val: any) => setCustomerType(val)}
								>
									<SelectTrigger className="h-8.5 text-xs">
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Wholesale Dealer" className="text-xs">
											Wholesale Dealer
										</SelectItem>
										<SelectItem value="Workshop / Mechanic" className="text-xs">
											Workshop / Mechanic
										</SelectItem>
										<SelectItem value="Retail Customer" className="text-xs">
											Retail Khata Customer
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Default Payment Mode</Label>
								<Select
									value={paymentMethod}
									onValueChange={(val: any) => setPaymentMethod(val)}
								>
									<SelectTrigger className="h-8.5 text-xs">
										<SelectValue placeholder="Select mode" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Credit / Khata" className="text-xs">
											Credit / Khata Ledger
										</SelectItem>
										<SelectItem value="Cash on Counter" className="text-xs">
											Cash on Counter
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Credit Limit & Opening Balance */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t">
							<div className="space-y-1.5">
								<Label htmlFor="cust-limit" className="text-xs font-semibold flex items-center gap-1">
									<ShieldCheck className="size-3 text-primary" />
									Credit Limit (Rs.)
								</Label>
								<Input
									id="cust-limit"
									type="number"
									min="0"
									step="1000"
									placeholder="50000"
									value={creditLimit}
									onChange={(e) => setCreditLimit(e.target.value)}
									className="h-8.5 text-xs font-mono font-semibold"
								/>
								<p className="text-[10px] text-muted-foreground">
									Maximum allowable outstanding credit balance.
								</p>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="cust-opening" className="text-xs font-semibold flex items-center gap-1">
									<Wallet className="size-3 text-amber-600" />
									Opening Balance (Rs.)
								</Label>
								<Input
									id="cust-opening"
									type="number"
									min="0"
									step="100"
									placeholder="0"
									value={openingBalance}
									onChange={(e) => setOpeningBalance(e.target.value)}
									className="h-8.5 text-xs font-mono font-semibold text-amber-700 dark:text-amber-400"
								/>
								<p className="text-[10px] text-muted-foreground">
									Previous dues from old notebooks/registers.
								</p>
							</div>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={isSubmitting}
							className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="size-3.5 animate-spin" />
									Registering...
								</>
							) : (
								<>
									<UserPlus className="size-3.5" />
									Save & Register Customer
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
