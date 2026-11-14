"use client";

import { useState, useEffect, useMemo } from "react";
import {
	Store,
	Search,
	Plus,
	Minus,
	Trash2,
	Printer,
	Receipt,
	CheckCircle2,
	AlertTriangle,
	Clock,
	Bike,
	User,
	Calculator,
	Banknote,
	ShieldCheck,
	ArrowRight,
	Check,
	X,
	Layers,
	BadgePercent,
	FileText,
	Sparkles,
	CreditCard,
	Share2,
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
	BRANCHES,
	BIKE_MODELS,
	FREQUENT_CUSTOMERS,
	type BranchId,
	type CounterCartItem,
	type CustomerProfile,
} from "./types";
import { INITIAL_PRODUCTS, type ProductItem } from "@/components/Products/types";
import { InvoiceSheet } from "@/components/Orders/invoice-sheet";
import type { OrderRecord } from "@/components/Orders/types";
import Link from "next/link";

const LOCAL_STORAGE_BRANCH_KEY = "sarfraz_active_branch_id";
const DEFAULT_WARRANTY_POLICY =
	"7 Days Check Warranty Only (Return / Exchange within 7 days)";

export function CounterView() {
	// Branch selection with localStorage persistence
	const [activeBranchId, setActiveBranchId] = useState<BranchId>("main");
	const [isHydrated, setIsHydrated] = useState(false);

	// Load stored branch from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem(LOCAL_STORAGE_BRANCH_KEY);
			if (saved && (saved === "main" || saved === "branch-2" || saved === "branch-3")) {
				setActiveBranchId(saved as BranchId);
			}
		} catch {
			// ignore storage access restrictions
		}
		setIsHydrated(true);
	}, []);

	// Handle branch change with persistence
	const handleBranchChange = (newBranchId: BranchId) => {
		setActiveBranchId(newBranchId);
		try {
			localStorage.setItem(LOCAL_STORAGE_BRANCH_KEY, newBranchId);
		} catch {
			// ignore
		}
	};

	const currentBranch = useMemo(() => {
		return BRANCHES.find((b) => b.id === activeBranchId) || BRANCHES[0];
	}, [activeBranchId]);

	// Customer state with live Khata ledger data
	const [customer, setCustomer] = useState<CustomerProfile>(FREQUENT_CUSTOMERS[1]); // Default to Dilawar Autos Saddar (Wholesale)

	// Cart items state with Scheme Rate support
	const [cart, setCart] = useState<CounterCartItem[]>([
		{
			id: "cart-init-1",
			productId: "PRD-101",
			sku: "CRN-CD70-PST",
			name: "Crown QINGQI-4ST Piston Kit 70cc",
			bikeModel: "Honda CD70",
			category: "Engine & Transmission",
			rate: 1450,
			retailRate: 1650,
			wholesaleRate: 1450,
			schemeRate: 1280,
			isSchemeActive: false,
			quantity: 2,
			unit: "Kit",
			branchStock: 45,
			pricingTier: "Wholesale",
		},
		{
			id: "cart-init-2",
			productId: "PRD-102",
			sku: "CRN-CD70-CLT",
			name: "Crown CD70F Clutch Gear Big (OEM Grade)",
			bikeModel: "Honda CD70",
			category: "Engine & Transmission",
			rate: 1120,
			retailRate: 1250,
			wholesaleRate: 1120,
			schemeRate: 980,
			isSchemeActive: false,
			quantity: 1,
			unit: "Pcs",
			branchStock: 34,
			pricingTier: "Wholesale",
		},
	]);

	// Product Search & Filter state
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [selectedBikeModel, setSelectedBikeModel] = useState<string>("Honda CD70");
	const [selectedPricingTier, setSelectedPricingTier] = useState<"Retail" | "Wholesale">("Wholesale");
	const [inputQuantity, setInputQuantity] = useState<number>(1);

	// Financials & Register
	const [discountValue, setDiscountValue] = useState<number>(0);
	const [shippingOrFitting, setShippingOrFitting] = useState<number>(0);
	const [cashReceived, setCashReceived] = useState<number>(4020);
	const [successNotice, setSuccessNotice] = useState<string | null>(null);

	// Invoice Sheet Modal
	const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<OrderRecord | null>(null);
	const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

	// Clock display - only shows live timing as requested
	const [currentTime, setCurrentTime] = useState<string>("");
	useEffect(() => {
		const updateTime = () => {
			const now = new Date();
			setCurrentTime(
				now.toLocaleTimeString("en-PK", {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: true,
				})
			);
		};
		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	}, []);

	// Filtered catalog products based on query & branch stock
	const matchingProducts = useMemo(() => {
		return INITIAL_PRODUCTS.filter((prod) => {
			const matchesQuery =
				!searchQuery.trim() ||
				prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				prod.sku.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory =
				selectedCategory === "All" || prod.category === selectedCategory;
			const matchesModel =
				selectedBikeModel === "All Models" ||
				prod.bikeModel.toLowerCase().includes(selectedBikeModel.toLowerCase()) ||
				prod.bikeModel.includes("Universal");
			return matchesQuery && matchesCategory && matchesModel;
		}).slice(0, 8);
	}, [searchQuery, selectedCategory, selectedBikeModel]);

	// Stock lookup helper for active branch
	const getBranchStock = (product: ProductItem): number => {
		const branchObj = product.branches.find((b) => b.branchId === activeBranchId);
		return branchObj ? branchObj.stock : Math.floor(product.totalStock / 3);
	};

	// Add item to cart
	const handleAddCatalogItem = (product: ProductItem) => {
		const stock = getBranchStock(product);
		const rate =
			selectedPricingTier === "Retail"
				? Math.round(product.price * 1.15)
				: product.price;
		const schemeRate = Math.round(product.price * 0.88); // 12% wholesale scheme discount

		setCart((prev) => {
			const existingIndex = prev.findIndex(
				(item) => item.productId === product.id && item.bikeModel === selectedBikeModel
			);
			if (existingIndex > -1) {
				const updated = [...prev];
				updated[existingIndex] = {
					...updated[existingIndex],
					quantity: updated[existingIndex].quantity + (inputQuantity || 1),
				};
				return updated;
			}
			const newItem: CounterCartItem = {
				id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
				productId: product.id,
				sku: product.sku,
				name: product.name,
				bikeModel: selectedBikeModel,
				category: product.category,
				rate: rate,
				retailRate: Math.round(product.price * 1.15),
				wholesaleRate: product.price,
				schemeRate: schemeRate,
				isSchemeActive: false,
				quantity: inputQuantity > 0 ? inputQuantity : 1,
				unit: product.unit,
				branchStock: stock,
				pricingTier: selectedPricingTier,
				imageUrl: product.imageUrl,
			};
			return [newItem, ...prev];
		});

		setSearchQuery("");
		setInputQuantity(1);
		showFlashNotice(`Added "${product.name}" to counter cart`);
	};

	// Cart manipulations
	const updateQuantity = (id: string, delta: number) => {
		setCart((prev) =>
			prev
				.map((item) => {
					if (item.id === id) {
						const nextQty = Math.max(1, item.quantity + delta);
						return { ...item, quantity: nextQty };
					}
					return item;
				})
				.filter((item) => item.quantity > 0)
		);
	};

	// Direct numeric quantity entry (fixes client meeting issue: typing 50 or 100 directly)
	const setDirectQuantity = (id: string, qty: number) => {
		const validQty = Math.max(1, isNaN(qty) ? 1 : qty);
		setCart((prev) =>
			prev.map((item) => (item.id === id ? { ...item, quantity: validQty } : item))
		);
	};

	// 1-Click Wholesale Net Scheme Rate Toggle (Requested in Video 1)
	const toggleNetScheme = (id: string) => {
		setCart((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					const willBeActive = !item.isSchemeActive;
					const schemePrice = item.schemeRate || Math.round(item.wholesaleRate * 0.88);
					return {
						...item,
						isSchemeActive: willBeActive,
						rate: willBeActive
							? schemePrice
							: item.pricingTier === "Retail"
							? item.retailRate
							: item.wholesaleRate,
					};
				}
				return item;
			})
		);
		showFlashNotice("Applied Wholesale Scheme Net Rate");
	};

	// Quick Customer Switcher
	const handleSelectCustomer = (custId: string) => {
		const found = FREQUENT_CUSTOMERS.find((c) => c.id === custId);
		if (found) {
			setCustomer(found);
			showFlashNotice(`Loaded ${found.name} (Khata: Rs. ${(found.currentBalance || 0).toLocaleString()})`);
		}
	};

	const updateItemRate = (id: string, newRate: number) => {
		setCart((prev) =>
			prev.map((item) => (item.id === id ? { ...item, rate: Math.max(0, newRate) } : item))
		);
	};

	const updateItemModel = (id: string, newModel: string) => {
		setCart((prev) =>
			prev.map((item) => (item.id === id ? { ...item, bikeModel: newModel } : item))
		);
	};

	const removeItem = (id: string) => {
		setCart((prev) => prev.filter((item) => item.id !== id));
	};

	const clearCart = () => {
		if (cart.length === 0) return;
		if (confirm("Clear current counter cart?")) {
			setCart([]);
			setDiscountValue(0);
			setShippingOrFitting(0);
			setCashReceived(0);
			showFlashNotice("Counter cart cleared");
		}
	};

	// Flash notification helper
	const showFlashNotice = (msg: string) => {
		setSuccessNotice(msg);
		setTimeout(() => setSuccessNotice(null), 3000);
	};

	// Totals calculations
	const subtotal = useMemo(() => {
		return cart.reduce((sum, item) => sum + item.rate * item.quantity, 0);
	}, [cart]);

	const totalItemsCount = useMemo(() => {
		return cart.reduce((sum, item) => sum + item.quantity, 0);
	}, [cart]);

	const netBill = useMemo(() => {
		const total = subtotal - (discountValue || 0) + (shippingOrFitting || 0);
		return Math.max(0, total);
	}, [subtotal, discountValue, shippingOrFitting]);

	// Auto match cash received when empty or cart changes
	useEffect(() => {
		if (cashReceived === 0 && netBill > 0) {
			setCashReceived(netBill);
		}
	}, [netBill]);

	const changeReturn = useMemo(() => {
		return (cashReceived || 0) - netBill;
	}, [cashReceived, netBill]);

	// Generate Printable Invoice
	const handleCreateInvoice = (action: "print" | "save") => {
		if (cart.length === 0) {
			alert("Cart is empty. Please add parts before issuing invoice.");
			return;
		}

		const invoiceNo = `INV-${currentBranch.shortName.substring(0, 3).toUpperCase()}-${Math.floor(
			10000 + Math.random() * 90000
		)}`;
		const orderId = `#SA-${Math.floor(10000 + Math.random() * 90000)}`;

		const generatedOrder: OrderRecord = {
			id: orderId,
			invoiceNumber: invoiceNo,
			customerName: customer.name || "Walk-in Retail Customer",
			customerCity: customer.city || "Karachi",
			customerPhone: customer.phone,
			type: customer.type.includes("Wholesale") ? "Wholesale" : "Retail",
			items: cart.map((ci) => ({
				name: ci.name,
				subLabel: `${ci.bikeModel.toUpperCase()} (${ci.category})`,
				quantity: ci.quantity,
				rate: ci.rate,
				total: ci.rate * ci.quantity,
			})),
			totalQuantity: totalItemsCount,
			totalAmount: subtotal,
			shippingCharges: shippingOrFitting,
			cashReceived: cashReceived,
			netBill: netBill,
			finalBalance: changeReturn < 0 ? Math.abs(changeReturn) : 0,
			status: "Completed",
			date: new Date().toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
			dateTimeFull: `${new Date()
				.toLocaleDateString("en-GB", {
					day: "2-digit",
					month: "short",
					year: "2-digit",
				})
				.toUpperCase()} ${currentTime || "12:00 PM"}`,
			paymentMethod:
				customer.paymentMethod === "Credit / Khata"
					? "On Credit / COD"
					: customer.paymentMethod === "Online Transfer"
					? "Online Transfer"
					: "Cash on Counter",
			godown: currentBranch.name.toUpperCase(),
			remarks: DEFAULT_WARRANTY_POLICY,
		};

		setActiveInvoiceOrder(generatedOrder);

		if (action === "print") {
			setIsInvoiceOpen(true);
		} else {
			showFlashNotice(`Order ${generatedOrder.invoiceNumber} recorded successfully!`);
			setCart([]);
			setDiscountValue(0);
			setShippingOrFitting(0);
		}
	};

	return (
		<div className="flex flex-col gap-5 w-full max-w-[1600px] mx-auto pb-16">
			{/* TOP BAR: SHADCN BRANCH SELECTOR & LIVE TIMING ONLY */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				{/* Left: Branch Indicator & shadcn Select */}
				<div className="flex flex-col sm:flex-row sm:items-center gap-3.5 flex-1 min-w-0">
					<div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<Store className="size-5" />
					</div>
					<div className="space-y-1.5 flex-1 max-w-md">
						<div className="flex items-center gap-2">
							<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Active Shop Counter
							</span>
							<Badge
								variant="outline"
								className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[10px] py-0 px-2 flex items-center gap-1 font-medium"
							>
								<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
								Terminal Online
							</Badge>
						</div>

						{/* shadcn Select for Branch Selection */}
						<Select
							value={activeBranchId}
							onValueChange={(val) => {
								if (val) handleBranchChange(val as BranchId);
							}}
						>
							<SelectTrigger className="h-9 text-xs sm:text-sm font-bold w-full bg-background border-input">
								<SelectValue placeholder="Select Branch Counter..." />
							</SelectTrigger>
							<SelectContent>
								{BRANCHES.map((b) => (
									<SelectItem key={b.id} value={b.id} className="text-xs font-medium">
										{b.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Center: Branch Details snippet */}
				<div className="hidden lg:flex items-center gap-6 text-xs text-muted-foreground border-x px-6">
					<div>
						<span className="block text-[10px] uppercase font-semibold text-muted-foreground/80">
							Branch Location
						</span>
						<p className="font-medium text-foreground truncate max-w-xs">
							{currentBranch.address}
						</p>
					</div>
					<div>
						<span className="block text-[10px] uppercase font-semibold text-muted-foreground/80">
							Counter Hotline
						</span>
						<p className="font-medium text-foreground font-mono">{currentBranch.phone}</p>
					</div>
				</div>

				{/* Right: Timing only (Hold bill & New bill removed as requested) */}
				<div className="flex items-center justify-end gap-3 shrink-0">
					<div className="flex items-center gap-2 bg-muted/50 border px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-foreground shadow-2xs">
						<Clock className="size-4 text-primary" />
						<span>{currentTime || "12:00:00 PM"}</span>
					</div>
				</div>
			</div>

			{/* FLASH NOTIFICATION */}
			{successNotice && (
				<div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
						<span>{successNotice}</span>
					</div>
					<button
						type="button"
						onClick={() => setSuccessNotice(null)}
						className="text-muted-foreground hover:text-foreground cursor-pointer"
					>
						<X className="size-3.5" />
					</button>
				</div>
			)}

			{/* MAIN 2-COLUMN COUNTER GRID */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
				{/* LEFT COLUMN: PRODUCT SELECTION & CART TABLE (Col span 7 on large) */}
				<div className="lg:col-span-7 flex flex-col gap-4">
					{/* PRODUCT ENTRY / SEARCH CARD */}
					<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-4">
						{/* Header: Title & Pricing Tier Toggle */}
						<div className="flex items-center justify-between border-b pb-3 gap-2">
							<div className="flex items-center gap-2">
								<Layers className="size-4 text-primary" />
								<h2 className="font-heading font-bold text-sm text-foreground">
									Spare Parts Inventory Catalog
								</h2>
							</div>

							{/* Pricing Tier Toggle (Retail vs Wholesale) */}
							<div className="flex items-center gap-1.5 bg-muted/60 p-0.5 rounded-lg border">
								<button
									type="button"
									onClick={() => setSelectedPricingTier("Wholesale")}
									className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
										selectedPricingTier === "Wholesale"
											? "bg-background text-foreground shadow-xs"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									Wholesale
								</button>
								<button
									type="button"
									onClick={() => setSelectedPricingTier("Retail")}
									className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
										selectedPricingTier === "Retail"
											? "bg-background text-foreground shadow-xs"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									Retail
								</button>
							</div>
						</div>

						{/* Bike Model & Filters Row with shadcn Select */}
						<div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
							{/* Bike Model Selector (shadcn Select) */}
							<div className="sm:col-span-6 space-y-1">
								<label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
									<Bike className="size-3 text-primary" />
									Target Bike Model:
								</label>
								<Select
									value={selectedBikeModel}
									onValueChange={(val) => {
										if (val) setSelectedBikeModel(val);
									}}
								>
									<SelectTrigger className="h-9 text-xs w-full bg-background">
										<SelectValue placeholder="Select Bike Model..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="All Models" className="text-xs">
											All Models / Universal
										</SelectItem>
										{BIKE_MODELS.map((model) => (
											<SelectItem key={model} value={model} className="text-xs">
												{model}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Category Filter (shadcn Select) */}
							<div className="sm:col-span-3 space-y-1">
								<label className="text-[11px] font-semibold text-muted-foreground">
									Category:
								</label>
								<Select
									value={selectedCategory}
									onValueChange={(val) => {
										if (val) setSelectedCategory(val);
									}}
								>
									<SelectTrigger className="h-9 text-xs w-full bg-background truncate">
										<SelectValue placeholder="Category..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="All" className="text-xs">
											All Categories
										</SelectItem>
										<SelectItem value="Engine & Transmission" className="text-xs">
											Engine & Transmission
										</SelectItem>
										<SelectItem value="Electrical & Lighting" className="text-xs">
											Electrical & Lighting
										</SelectItem>
										<SelectItem value="Brakes & Suspension" className="text-xs">
											Brakes & Suspension
										</SelectItem>
										<SelectItem value="Chassis & Body" className="text-xs">
											Chassis & Body
										</SelectItem>
										<SelectItem value="Cables & Control" className="text-xs">
											Cables & Control
										</SelectItem>
										<SelectItem value="Tyres & Wheels" className="text-xs">
											Tyres & Wheels
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Quantity to Add */}
							<div className="sm:col-span-3 space-y-1">
								<label className="text-[11px] font-semibold text-muted-foreground">
									Quantity:
								</label>
								<div className="flex items-center border rounded-lg overflow-hidden bg-background h-9">
									<button
										type="button"
										onClick={() => setInputQuantity((q) => Math.max(1, q - 1))}
										className="px-2.5 h-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
									>
										<Minus className="size-3" />
									</button>
									<input
										type="number"
										min={1}
										value={inputQuantity}
										onChange={(e) => setInputQuantity(Math.max(1, parseInt(e.target.value) || 1))}
										className="w-full text-center text-xs font-bold text-foreground bg-transparent focus:outline-none"
									/>
									<button
										type="button"
										onClick={() => setInputQuantity((q) => q + 1)}
										className="px-2.5 h-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
									>
										<Plus className="size-3" />
									</button>
								</div>
							</div>
						</div>

						{/* Search Input Bar */}
						<div className="space-y-2">
							<div className="relative">
								<Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
								<Input
									placeholder="Search spare part name or SKU (e.g. Piston, Clutch Gear, Brake Shoe, Chain)..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9 h-10 text-xs font-medium bg-background"
								/>
								{searchQuery && (
									<button
										type="button"
										onClick={() => setSearchQuery("")}
										className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
									>
										<X className="size-4" />
									</button>
								)}
							</div>

							{/* Autocomplete / Suggested Products dropdown */}
							{searchQuery.trim().length > 0 && (
								<div className="rounded-xl border bg-popover shadow-lg max-h-64 overflow-y-auto divide-y divide-border">
									{matchingProducts.length === 0 ? (
										<div className="p-4 text-center text-xs text-muted-foreground">
											No matching product found in catalog for "{searchQuery}".
										</div>
									) : (
										matchingProducts.map((prod) => {
											const branchStock = getBranchStock(prod);
											const displayPrice =
												selectedPricingTier === "Retail"
													? Math.round(prod.price * 1.15)
													: prod.price;

											return (
												<div
													key={prod.id}
													className="p-2.5 hover:bg-muted/50 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
													onClick={() => handleAddCatalogItem(prod)}
												>
													<div className="flex items-center gap-3 min-w-0 flex-1">
														{/* Product Thumbnail / Icon */}
														<div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
															{prod.category.includes("Engine") ? (
																<Sparkles className="size-5" />
															) : prod.category.includes("Brake") ? (
																<ShieldCheck className="size-5" />
															) : prod.category.includes("Electrical") ? (
																<Layers className="size-5" />
															) : (
																<Bike className="size-5" />
															)}
														</div>

														<div className="min-w-0 flex-1">
															<div className="flex items-center gap-2">
																<span className="font-semibold text-xs text-foreground truncate">
																	{prod.name}
																</span>
																<Badge variant="secondary" className="text-[10px] py-0 px-1.5 shrink-0">
																	{prod.bikeModel}
																</Badge>
															</div>
															<div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
																<span>SKU: {prod.sku}</span>
																<span>•</span>
																<span className="text-foreground font-medium">
																	Rs. {displayPrice.toLocaleString()} ({selectedPricingTier})
																</span>
																<span>•</span>
																<span
																	className={`font-semibold ${
																		branchStock > 10
																			? "text-emerald-600 dark:text-emerald-400"
																			: branchStock > 0
																			? "text-amber-600 dark:text-amber-400"
																			: "text-rose-600"
																	}`}
																>
																	{branchStock} {prod.unit} in {currentBranch.shortName}
																</span>
															</div>
														</div>
													</div>

													<Button
														size="sm"
														className="h-7 px-3 text-xs gap-1 bg-primary text-primary-foreground shrink-0 cursor-pointer"
														onClick={(e) => {
															e.stopPropagation();
															handleAddCatalogItem(prod);
														}}
													>
														<Plus className="size-3" />
														Add
													</Button>
												</div>
											);
										})
									)}
								</div>
							)}
						</div>
					</div>

					{/* CART LINE ITEMS TABLE */}
					<div className="rounded-2xl border bg-card shadow-xs overflow-hidden flex flex-col">
						{/* Table Header / Action Bar */}
						<div className="p-4 border-b bg-muted/20 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<Receipt className="size-4 text-primary" />
								<h2 className="font-heading font-bold text-sm text-foreground">
									Current Counter Cart
								</h2>
								<Badge variant="secondary" className="text-xs font-mono font-semibold">
									{totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
								</Badge>
							</div>

							<div className="flex items-center gap-2">
								<span className="text-xs text-muted-foreground hidden sm:inline">
									Branch Stock:{" "}
									<strong className="text-foreground">{currentBranch.shortName}</strong>
								</span>
								<Button
									variant="ghost"
									size="xs"
									onClick={clearCart}
									disabled={cart.length === 0}
									className="text-muted-foreground hover:text-rose-600 cursor-pointer h-7 text-xs"
								>
									Clear Table
								</Button>
							</div>
						</div>

						{/* Items Table */}
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead className="bg-muted/40 text-muted-foreground font-semibold border-b">
									<tr>
										<th className="py-2.5 px-3 w-10 text-center">#</th>
										<th className="py-2.5 px-3 min-w-[200px]">Product & Bike Model</th>
										<th className="py-2.5 px-3 min-w-[100px]">Type / Rate</th>
										<th className="py-2.5 px-3 min-w-[120px] text-center">Qty</th>
										<th className="py-2.5 px-3 min-w-[90px] text-right">Total (PKR)</th>
										<th className="py-2.5 px-3 w-10 text-center"></th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{cart.length === 0 ? (
										<tr>
											<td colSpan={6} className="py-12 text-center text-muted-foreground space-y-2">
												<Receipt className="size-8 mx-auto opacity-30" />
												<p className="text-xs font-medium">Cart is currently empty.</p>
												<p className="text-[11px] text-muted-foreground">
													Search spare parts above and add them to create customer bill.
												</p>
											</td>
										</tr>
									) : (
										cart.map((item, index) => {
											const lineTotal = item.rate * item.quantity;
											const isLowBranchStock =
												item.branchStock > 0 && item.quantity > item.branchStock;

											return (
												<tr key={item.id} className="hover:bg-muted/30 transition-colors">
													<td className="py-3 px-3 text-center font-mono text-muted-foreground">
														{index + 1}
													</td>

													{/* Product Name, Thumbnail & Model selection */}
													<td className="py-3 px-3">
														<div className="flex items-start gap-2.5">
															{/* Visual Part Thumbnail */}
															<div className="size-9 rounded-md bg-muted border flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
																{item.category.includes("Engine") ? (
																	<Sparkles className="size-4 text-primary" />
																) : item.category.includes("Brake") ? (
																	<ShieldCheck className="size-4 text-primary" />
																) : (
																	<Bike className="size-4 text-primary" />
																)}
															</div>

															<div className="min-w-0 flex-1">
																<div className="font-semibold text-foreground leading-snug">
																	{item.name}
																</div>
																<div className="flex items-center flex-wrap gap-1.5 mt-1">
																	{/* Model Dropdown */}
																	<select
																		value={item.bikeModel}
																		onChange={(e) => updateItemModel(item.id, e.target.value)}
																		className="text-[10px] font-semibold bg-muted/60 hover:bg-muted rounded px-1.5 py-0.5 border text-foreground focus:outline-none cursor-pointer"
																	>
																		{BIKE_MODELS.map((m) => (
																			<option key={m} value={m}>
																				{m}
																			</option>
																		))}
																	</select>

																	{/* Wholesale Net Scheme Button (Video 1 Request) */}
																	<button
																		type="button"
																		onClick={() => toggleNetScheme(item.id)}
																		className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
																			item.isSchemeActive
																				? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-black shadow-2xs"
																				: "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
																		}`}
																		title="Toggle Wholesale Scheme Rate"
																	>
																		<BadgePercent className="size-2.5" />
																		{item.isSchemeActive ? "Scheme Active" : "Net Scheme"}
																	</button>

																	{isLowBranchStock && (
																		<Badge
																			variant="destructive"
																			className="text-[9px] py-0 px-1 font-normal flex items-center gap-0.5"
																			title={`Branch has ${item.branchStock} in stock`}
																		>
																			<AlertTriangle className="size-2.5" />
																			Low Stock ({item.branchStock})
																		</Badge>
																	)}
																</div>
															</div>
														</div>
													</td>

													{/* Price and Rate Edit */}
													<td className="py-3 px-3">
														<div className="flex items-center gap-1">
															<span className="text-[10px] text-muted-foreground">Rs.</span>
															<input
																type="number"
																value={item.rate}
																onChange={(e) =>
																	updateItemRate(item.id, parseInt(e.target.value) || 0)
																}
																className={`w-16 h-7 px-1.5 font-mono font-bold text-xs rounded border text-right focus:outline-none focus:ring-1 focus:ring-primary ${
																	item.isSchemeActive
																		? "bg-amber-500/10 border-amber-500/60 text-amber-900 dark:text-amber-200"
																		: "bg-background text-foreground"
																}`}
															/>
														</div>
														<span className="text-[10px] text-muted-foreground block mt-0.5">
															{item.isSchemeActive ? "Scheme Rate" : `${item.pricingTier} Rate`}
														</span>
													</td>

													{/* Quantity +/- controls with DIRECT NUMERIC INPUT (Fix for Video 1) */}
													<td className="py-3 px-3 text-center">
														<div className="inline-flex items-center border rounded-lg overflow-hidden bg-background h-7 shadow-2xs">
															<button
																type="button"
																onClick={() => updateQuantity(item.id, -1)}
																className="px-2 h-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
															>
																<Minus className="size-3" />
															</button>
															<input
																type="number"
																min={1}
																value={item.quantity}
																onChange={(e) =>
																	setDirectQuantity(item.id, parseInt(e.target.value) || 1)
																}
																className="w-12 h-full text-center font-mono font-bold text-xs text-foreground bg-transparent border-0 outline-none p-0 focus:bg-muted/20"
															/>
															<button
																type="button"
																onClick={() => updateQuantity(item.id, 1)}
																className="px-2 h-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
															>
																<Plus className="size-3" />
															</button>
														</div>
														<span className="text-[10px] text-muted-foreground block mt-0.5">
															{item.unit}
														</span>
													</td>

													{/* Line Total */}
													<td className="py-3 px-3 text-right font-mono font-bold text-foreground">
														Rs. {lineTotal.toLocaleString()}
													</td>

													{/* Delete action */}
													<td className="py-3 px-3 text-center">
														<button
															type="button"
															onClick={() => removeItem(item.id)}
															className="text-muted-foreground hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
															title="Remove item"
														>
															<Trash2 className="size-3.5" />
														</button>
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>

						{/* Subtotal Footer inside table */}
						{cart.length > 0 && (
							<div className="p-3 border-t bg-muted/10 flex items-center justify-between text-xs font-semibold px-4">
								<span className="text-muted-foreground">
									Total Spare Parts: {cart.length} lines ({totalItemsCount} units)
								</span>
								<span className="text-foreground font-mono">
									Gross Subtotal: Rs. {subtotal.toLocaleString()}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* RIGHT COLUMN: CUSTOMER DETAILS, CASH REGISTER & INVOICING (Col span 5 on large) */}
				<div className="lg:col-span-5 flex flex-col gap-4">
					{/* CUSTOMER PROFILE CARD */}
					<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
						<div className="flex items-center justify-between border-b pb-2.5">
							<h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
								<User className="size-4 text-primary" />
								Customer Information
							</h3>
							<div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border">
								<button
									type="button"
									onClick={() => {
										setCustomer({ ...customer, type: "Retail Customer" });
										setSelectedPricingTier("Retail");
									}}
									className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all cursor-pointer ${
										customer.type === "Retail Customer"
											? "bg-background text-foreground shadow-2xs font-bold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									Retail
								</button>
								<button
									type="button"
									onClick={() => {
										setCustomer({ ...customer, type: "Wholesale Dealer" });
										setSelectedPricingTier("Wholesale");
									}}
									className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all cursor-pointer ${
										customer.type === "Wholesale Dealer"
											? "bg-background text-foreground shadow-2xs font-bold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									Wholesale
								</button>
							</div>
						</div>

						{/* Customer Quick Selector Dropdown & Details */}
						<div className="space-y-3 pt-1">
							<div className="space-y-1">
								<div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
									<span>Select Registered Khata Customer:</span>
									<Link
										href="/dashboard/ledger"
										className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-bold"
									>
										Open Ledgers <ArrowRight className="size-2.5" />
									</Link>
								</div>
								<Select
									value={customer.id || ""}
									onValueChange={(val) => {
										if (val) handleSelectCustomer(val);
									}}
								>
									<SelectTrigger className="h-8 text-xs w-full bg-background font-semibold">
										<SelectValue placeholder="Choose customer khata..." />
									</SelectTrigger>
									<SelectContent>
										{FREQUENT_CUSTOMERS.map((cust) => (
											<SelectItem key={cust.id} value={cust.id || ""} className="text-xs">
												<div className="flex items-center justify-between w-full gap-3">
													<span className="font-semibold">{cust.name}</span>
													<span className="text-[10px] font-mono text-muted-foreground">
														{cust.currentBalance ? `Rs. ${cust.currentBalance.toLocaleString()}` : "Zero Bal"}
													</span>
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="space-y-1">
									<label className="text-[11px] font-semibold text-muted-foreground">
										Customer / Shop Name:
									</label>
									<Input
										value={customer.name}
										onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
										className="h-8 text-xs bg-background"
										placeholder="e.g. Walk-in Customer"
									/>
								</div>

								<div className="space-y-1">
									<label className="text-[11px] font-semibold text-muted-foreground">
										Contact Phone:
									</label>
									<Input
										value={customer.phone}
										onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
										className="h-8 text-xs bg-background"
										placeholder="0333-1285556"
									/>
								</div>

								<div className="space-y-1">
									<label className="text-[11px] font-semibold text-muted-foreground">
										City / Market:
									</label>
									<Input
										value={customer.city}
										onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
										className="h-8 text-xs bg-background"
										placeholder="Karachi"
									/>
								</div>

								{/* Payment Terms with shadcn Select */}
								<div className="space-y-1">
									<label className="text-[11px] font-semibold text-muted-foreground">
										Payment Terms:
									</label>
									<Select
										value={customer.paymentMethod}
										onValueChange={(val) => {
											if (val) {
												setCustomer({
													...customer,
													paymentMethod: val as CustomerProfile["paymentMethod"],
												});
											}
										}}
									>
										<SelectTrigger className="h-8 text-xs w-full bg-background font-semibold">
											<SelectValue placeholder="Payment Mode..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Cash on Counter" className="text-xs">
												Cash on Counter
											</SelectItem>
											<SelectItem value="Online Transfer" className="text-xs">
												Online Transfer (EasyPaisa/JazzCash/Bank)
											</SelectItem>
											<SelectItem value="Credit / Khata" className="text-xs">
												Credit / Khata Ledger
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Live Customer Khata Alert (Video 1 & 2 Request) */}
							{customer.currentBalance !== undefined && customer.currentBalance > 0 && (
								<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs space-y-1.5 animate-in fade-in">
									<div className="flex items-center justify-between font-bold text-amber-950 dark:text-amber-200">
										<span className="flex items-center gap-1.5">
											<CreditCard className="size-3.5 text-amber-600" />
											Previous Khata Balance:
										</span>
										<span className="font-mono text-sm font-black">
											Rs. {customer.currentBalance.toLocaleString()}
										</span>
									</div>
									<div className="text-[11px] text-amber-900/80 dark:text-amber-300/80 flex items-center justify-between">
										<span>Route: {customer.route || "Saddar"} ({customer.salesman || "Tariq Mehmood"})</span>
										<Link
											href={`/dashboard/ledger?customer=${encodeURIComponent(customer.name)}`}
											className="underline font-bold text-primary hover:text-primary/80"
										>
											View Statement
										</Link>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* BILL CALCULATION & CASH REGISTER CARD */}
					<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-4">
						<div className="flex items-center justify-between border-b pb-2.5">
							<h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
								<Calculator className="size-4 text-primary" />
								Bill Calculation & Cash Register
							</h3>
							<span className="text-xs font-mono text-muted-foreground">PKR (Rs.)</span>
						</div>

						{/* Breakdown rows */}
						<div className="space-y-2 text-xs">
							<div className="flex items-center justify-between py-1 border-b border-border/40">
								<span className="text-muted-foreground">Gross Items Subtotal:</span>
								<span className="font-mono font-semibold text-foreground">
									Rs. {subtotal.toLocaleString()}
								</span>
							</div>

							<div className="flex items-center justify-between py-1 border-b border-border/40">
								<span className="text-muted-foreground">Counter Discount:</span>
								<div className="flex items-center gap-1">
									<span className="text-rose-600 font-bold">- Rs.</span>
									<input
										type="number"
										min={0}
										value={discountValue}
										onChange={(e) =>
											setDiscountValue(Math.max(0, parseInt(e.target.value) || 0))
										}
										className="w-20 h-7 px-1.5 font-mono font-bold text-xs rounded border bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
									/>
								</div>
							</div>

							<div className="flex items-center justify-between py-1 border-b border-border/40">
								<span className="text-muted-foreground">Fitting / Packing / Delivery:</span>
								<div className="flex items-center gap-1">
									<span className="text-foreground font-medium">+ Rs.</span>
									<input
										type="number"
										min={0}
										value={shippingOrFitting}
										onChange={(e) =>
											setShippingOrFitting(Math.max(0, parseInt(e.target.value) || 0))
										}
										className="w-20 h-7 px-1.5 font-mono font-bold text-xs rounded border bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
									/>
								</div>
							</div>

							{/* NET TOTAL DISPLAY */}
							<div className="rounded-xl bg-primary/10 border-2 border-primary/30 p-3.5 flex items-center justify-between">
								<div>
									<span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
										Net Payable Bill
									</span>
									<span className="text-[10px] text-muted-foreground">
										Inclusive of warranty & taxes
									</span>
								</div>
								<div className="text-right">
									<span className="font-heading font-black text-2xl sm:text-3xl text-foreground font-mono">
										Rs. {netBill.toLocaleString()}
									</span>
								</div>
							</div>

							{/* CASH TENDER & CHANGE CALCULATION (Exact, Round 500 etc removed) */}
							<div className="pt-2 space-y-2.5">
								<div className="flex items-center justify-between">
									<label className="text-xs font-bold text-foreground flex items-center gap-1">
										<Banknote className="size-4 text-emerald-600" />
										Cash Tender / Received:
									</label>
									<div className="flex items-center gap-1">
										<span className="text-xs font-bold text-muted-foreground">Rs.</span>
										<input
											type="number"
											min={0}
											value={cashReceived}
											onChange={(e) =>
												setCashReceived(Math.max(0, parseInt(e.target.value) || 0))
											}
											className="w-28 h-8 px-2 font-mono font-black text-sm rounded-lg border-2 border-emerald-500/50 bg-background text-foreground text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
										/>
									</div>
								</div>

								{/* Return Balance or Due */}
								<div
									className={`rounded-xl p-3 border flex items-center justify-between ${
										changeReturn >= 0
											? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
											: "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300"
									}`}
								>
									<div>
										<span className="text-xs font-bold block">
											{changeReturn >= 0 ? "Change Due (Return to Customer):" : "Remaining Bill Due (Credit):"}
										</span>
										<span className="text-[10px] opacity-80">
											{changeReturn >= 0 ? "Hand over change" : "Will post to Khata balance"}
										</span>
									</div>
									<span className="font-mono font-black text-xl">
										Rs. {Math.abs(changeReturn).toLocaleString()}
									</span>
								</div>

								{/* Running Customer Khata Total (Previous Dues + Unpaid Current Bill) */}
								{customer.currentBalance !== undefined && customer.currentBalance > 0 && (
									<div className="rounded-xl p-3 bg-neutral-900 text-white dark:bg-neutral-800/90 flex items-center justify-between text-xs border border-neutral-700/60 shadow-xs">
										<div>
											<span className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider block">
												Net Cumulative Khata Dues
											</span>
											<span className="text-[11px] text-neutral-300">
												Previous Rs. {customer.currentBalance.toLocaleString()} {changeReturn < 0 ? `+ Rs. ${Math.abs(changeReturn).toLocaleString()}` : ""}
											</span>
										</div>
										<span className="font-mono font-black text-amber-400 text-base">
											Rs. {(customer.currentBalance + (changeReturn < 0 ? Math.abs(changeReturn) : 0)).toLocaleString()}
										</span>
									</div>
								)}
							</div>

							{/* Default 7-day checking warranty notice */}
							<div className="pt-2">
								<div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
									<ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
									<div className="space-y-0.5">
										<span className="text-xs font-bold text-foreground block">
											Warranty Standard:
										</span>
										<p className="text-[11px] text-muted-foreground leading-snug">
											{DEFAULT_WARRANTY_POLICY}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* INVOICE ACTION BUTTONS (Hold bill removed) */}
						<div className="pt-2 space-y-2 border-t">
							<Button
								onClick={() => handleCreateInvoice("print")}
								disabled={cart.length === 0}
								className="w-full h-11 text-sm font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md transition-all active:scale-98"
							>
								<Printer className="size-4" />
								<span>Generate & Print Thermal Invoice</span>
								<ArrowRight className="size-4 ml-auto" />
							</Button>

							<Button
								variant="outline"
								onClick={() => handleCreateInvoice("save")}
								disabled={cart.length === 0}
								className="w-full h-9 text-xs font-semibold gap-1.5 cursor-pointer text-foreground"
							>
								<Check className="size-3.5 text-emerald-600" />
								<span>Save Order (No Print)</span>
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* THERMAL / A4 INVOICE PREVIEW MODAL */}
			<InvoiceSheet
				order={activeInvoiceOrder}
				isOpen={isInvoiceOpen}
				onClose={() => setIsInvoiceOpen(false)}
			/>
		</div>
	);
}
