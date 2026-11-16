"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Check, ChevronsUpDown, Loader2, User, Phone, MapPin, UserPlus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerFormDialog } from "@/components/Customers/customer-form-dialog";
import { type CustomerProfile, DEFAULT_WALKIN_CUSTOMER } from "./types";

interface CustomerSearchSelectProps {
	selectedCustomerId?: string;
	onSelectCustomer: (customer: CustomerProfile) => void;
	fallbackCustomers?: CustomerProfile[];
}

export function CustomerSearchSelect({
	selectedCustomerId,
	onSelectCustomer,
}: CustomerSearchSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchingApi, setIsSearchingApi] = useState(false);
	const [apiResults, setApiResults] = useState<CustomerProfile[]>([]);
	const [activeCustomer, setActiveCustomer] = useState<CustomerProfile | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Fetch initial real customers from database
	const fetchInitialCustomers = async () => {
		try {
			const res = await fetch("/api/customers?page=1");
			if (res.ok) {
				const json = await res.json();
				if (json.success && Array.isArray(json.data)) {
					const mapped: CustomerProfile[] = json.data.map((c: any) => ({
						id: c.id,
						name: c.name,
						phone: c.phone || "--",
						city: c.city || "--",
						route: c.route || "--",
						salesman: c.salesman || "--",
						type: (c.customerType || "Wholesale Dealer") as any,
						paymentMethod: (c.paymentMethod || "Credit / Khata") as any,
						currentBalance: Number(c.currentBalance || 0),
						creditLimit: Number(c.creditLimit || 0),
					}));
					setApiResults(mapped);
				}
			}
		} catch (err) {
			console.error("Failed to load initial customers:", err);
		}
	};

	useEffect(() => {
		fetchInitialCustomers();
	}, []);

	// Keep activeCustomer in sync with selectedCustomerId prop from parent
	useEffect(() => {
		if (!selectedCustomerId || selectedCustomerId === "walkin") {
			setActiveCustomer(null);
			setSearchQuery("");
		} else if (apiResults.length > 0) {
			const found = apiResults.find((c) => c.id === selectedCustomerId);
			if (found) {
				setActiveCustomer(found);
			}
		}
	}, [selectedCustomerId, apiResults]);

	// Close on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Live API search debounce
	useEffect(() => {
		const trimmed = searchQuery.trim();
		if (!trimmed) {
			fetchInitialCustomers();
			setIsSearchingApi(false);
			return;
		}

		setIsSearchingApi(true);
		const timer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/customers?search=${encodeURIComponent(trimmed)}&page=1`);
				if (res.ok) {
					const json = await res.json();
					if (json.success && Array.isArray(json.data)) {
						const mapped: CustomerProfile[] = json.data.map((c: any) => ({
							id: c.id,
							name: c.name,
							phone: c.phone || "--",
							city: c.city || "--",
							route: c.route || "--",
							salesman: c.salesman || "--",
							type: (c.customerType || "Wholesale Dealer") as any,
							paymentMethod: (c.paymentMethod || "Credit / Khata") as any,
							currentBalance: Number(c.currentBalance || 0),
							creditLimit: Number(c.creditLimit || 0),
						}));
						setApiResults(mapped);
					}
				}
			} catch (err) {
				console.error("Failed to search customers:", err);
			} finally {
				setIsSearchingApi(false);
			}
		}, 200);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Display suggestions
	const displaySuggestions = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) {
			return apiResults;
		}

		return apiResults.filter(
			(c) =>
				c.name.toLowerCase().includes(query) ||
				c.phone.toLowerCase().includes(query) ||
				(c.city && c.city.toLowerCase().includes(query)) ||
				(c.route && c.route.toLowerCase().includes(query)) ||
				(c.id && c.id.toLowerCase().includes(query))
		);
	}, [searchQuery, apiResults]);

	const handleSelect = (customer: CustomerProfile) => {
		setActiveCustomer(customer);
		onSelectCustomer(customer);
		setIsOpen(false);
		setSearchQuery("");
	};

	const handleCustomerCreated = (newCust: CustomerProfile) => {
		setApiResults((prev) => [newCust, ...prev]);
		handleSelect(newCust);
		setIsAddCustomerOpen(false);
	};

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		setActiveCustomer(null);
		setSearchQuery("");
		onSelectCustomer(DEFAULT_WALKIN_CUSTOMER);
		setIsOpen(false);
	};

	const isWalkin = !activeCustomer || activeCustomer.id === "walkin";

	return (
		<div ref={containerRef} className="relative w-full">
			{/* Selected Customer View or Search Bar */}
			{!isOpen && activeCustomer && !isWalkin ? (
				<div
					onClick={() => {
						setIsOpen(true);
						setTimeout(() => inputRef.current?.focus(), 50);
					}}
					className="flex items-center justify-between p-2 rounded-xl border border-input bg-background/80 hover:bg-accent/40 cursor-pointer transition-all shadow-2xs group"
				>
					<div className="flex items-center gap-2.5 min-w-0">
						<div className="size-8 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 flex items-center justify-center font-bold text-xs">
							{activeCustomer.name.slice(0, 2).toUpperCase()}
						</div>
						<div className="min-w-0">
							<div className="font-semibold text-xs text-foreground truncate flex items-center gap-1.5">
								<span>{activeCustomer.name}</span>
								<Badge variant="outline" className="text-[9px] py-0 px-1 font-medium">
									{activeCustomer.type}
								</Badge>
							</div>
							<div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
								<span className="flex items-center gap-0.5">
									<Phone className="size-2.5" /> {activeCustomer.phone}
								</span>
								<span>•</span>
								<span className="flex items-center gap-0.5">
									<MapPin className="size-2.5" /> {activeCustomer.city || activeCustomer.route}
								</span>
								<span>•</span>
								<span className="font-semibold text-amber-700 dark:text-amber-400">
									Khata: {activeCustomer.currentBalance ? `Rs. ${activeCustomer.currentBalance.toLocaleString()}` : "Zero Bal"}
								</span>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-1.5 shrink-0 pl-2">
						<Badge
							variant="outline"
							className="text-[10px] bg-background text-muted-foreground group-hover:text-foreground group-hover:border-primary/50 transition-colors"
						>
							Change
						</Badge>
						<button
							type="button"
							onClick={handleClear}
							className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
							title="Clear selection"
						>
							<X className="size-3.5" />
						</button>
					</div>
				</div>
			) : (
				<div className="flex items-center gap-1.5">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
						<Input
							ref={inputRef}
							type="text"
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								if (!isOpen) setIsOpen(true);
							}}
							onFocus={() => setIsOpen(true)}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									setIsOpen(false);
								}
							}}
							placeholder="Search customer by name, phone, city, or route..."
							className="h-8.5 pl-8.5 pr-8 text-xs bg-background font-medium border-primary/40 focus-visible:ring-primary/20 shadow-2xs"
						/>
						{isSearchingApi ? (
							<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
						) : searchQuery ? (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
							>
								<X className="size-3.5" />
							</button>
						) : (
							<ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground opacity-60" />
						)}
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							setIsAddCustomerOpen(true);
						}}
						className="h-8.5 px-2.5 text-xs text-primary border-primary/40 hover:bg-primary/10 font-semibold shrink-0 gap-1"
						title="Register New Customer"
					>
						<UserPlus className="size-3.5" />
						<span className="hidden sm:inline">+ New</span>
					</Button>
				</div>
			)}

			{/* Suggestions Floating Dropdown */}
			{isOpen && (
				<div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-popover text-popover-foreground border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
					{/* Header note */}
					<div className="px-3 py-1.5 bg-muted/40 border-b flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
						<span className="flex items-center gap-1">
							<User className="size-3 text-primary" />
							{searchQuery ? `Search Results for "${searchQuery}"` : "Registered Khata Customers"}
						</span>
						<div className="flex items-center gap-2">
							<span className="text-[10px] font-mono">
								{displaySuggestions.length} {displaySuggestions.length === 1 ? "customer" : "customers"}
							</span>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={(e) => {
									e.stopPropagation();
									setIsAddCustomerOpen(true);
								}}
								className="h-6 px-2 text-[10px] text-primary hover:text-primary hover:bg-primary/10 font-bold gap-1"
							>
								<UserPlus className="size-3" />
								+ New Customer
							</Button>
						</div>
					</div>

					{/* Suggestions List */}
					<div className="max-h-56 overflow-y-auto divide-y divide-border/40 p-1">
						{displaySuggestions.length > 0 ? (
							displaySuggestions.map((cust) => {
								const isCurrent = cust.id === selectedCustomerId;
								const hasBalance = (cust.currentBalance || 0) > 0;
								return (
									<div
										key={cust.id}
										onClick={() => handleSelect(cust)}
										className={`flex items-center justify-between gap-3 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
											isCurrent
												? "bg-primary/10 text-primary font-semibold"
												: "hover:bg-muted/70 text-foreground"
										}`}
									>
										<div className="flex items-center gap-2.5 min-w-0">
											<div className="size-7 rounded-md bg-muted text-muted-foreground shrink-0 flex items-center justify-center font-bold text-[10px] border">
												{cust.name.slice(0, 2).toUpperCase()}
											</div>
											<div className="min-w-0">
												<div className="font-semibold truncate flex items-center gap-1.5">
													<span>{cust.name}</span>
													{isCurrent && <Check className="size-3 text-primary shrink-0" />}
												</div>
												<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
													<span>{cust.phone}</span>
													<span>•</span>
													<span>{cust.city || cust.route}</span>
													<span>•</span>
													<Badge variant="outline" className="text-[8px] py-0 px-1 font-normal">
														{cust.type}
													</Badge>
												</div>
											</div>
										</div>

										<div className="text-right shrink-0">
											<div
												className={`font-bold text-xs ${
													hasBalance ? "text-amber-700 dark:text-amber-400 font-mono" : "text-emerald-700 dark:text-emerald-400 font-medium"
												}`}
											>
												{hasBalance ? `Rs. ${cust.currentBalance?.toLocaleString()}` : "Zero Bal"}
											</div>
											<div className="text-[10px] text-muted-foreground">
												Limit: Rs. {cust.creditLimit?.toLocaleString() || "50k"}
											</div>
										</div>
									</div>
								);
							})
						) : (
							<div className="py-6 px-4 text-center text-xs text-muted-foreground">
								{isSearchingApi ? (
									<div className="flex items-center justify-center gap-2">
										<Loader2 className="size-4 animate-spin text-primary" />
										<span>Searching customer directory...</span>
									</div>
								) : (
									<div className="space-y-2">
										<p className="font-semibold text-foreground">
											{searchQuery ? `No customer found matching "${searchQuery}"` : "No registered khata customers found"}
										</p>
										<p className="text-[11px] text-muted-foreground leading-normal max-w-xs mx-auto">
											Register wholesale dealers and workshops to maintain their running Khata ledger and credit line.
										</p>
										<Button
											type="button"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												setIsAddCustomerOpen(true);
											}}
											className="h-7 px-3 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
										>
											<UserPlus className="size-3.5" />
											+ Register New Customer
										</Button>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			<CustomerFormDialog
				open={isAddCustomerOpen}
				onOpenChange={setIsAddCustomerOpen}
				onSuccess={handleCustomerCreated}
			/>
		</div>
	);
}
