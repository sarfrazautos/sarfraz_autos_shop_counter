"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
	Store,
	Search,
	Plus,
	Minus,
	Trash2,
	Printer,
	RotateCcw,
	Receipt,
	CheckCircle2,
	AlertTriangle,
	Sparkles,
	Clock,
	Layers,
	Bike,
	User,
	Phone,
	MapPin,
	DollarSign,
	ArrowRight,
	FileText,
	Check,
	PauseCircle,
	PlayCircle,
	X,
	Calculator,
	CreditCard,
	Banknote,
	ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	BRANCHES,
	BIKE_MODELS,
	FREQUENT_CUSTOMERS,
	COMMON_COUNTER_ITEMS,
	type BranchId,
	type CounterCartItem,
	type CustomerProfile,
} from "./types";
import { INITIAL_PRODUCTS, type ProductItem } from "@/components/Products/types";
import { InvoiceSheet } from "@/components/Orders/invoice-sheet";
import type { OrderRecord } from "@/components/Orders/types";

const LOCAL_STORAGE_BRANCH_KEY = "sarfraz_active_branch_id";

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

	// Customer state
	const [customer, setCustomer] = useState<CustomerProfile>(FREQUENT_CUSTOMERS[0]);
	const [customerNotes, setCustomerNotes] = useState("");

	// Cart items state
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
			quantity: 1,
			unit: "Pcs",
			branchStock: 34,
			pricingTier: "Wholesale",
		},
	]);

	// Parked / Held Cart
	const [parkedCart, setParkedCart] = useState<{
		cart: CounterCartItem[];
		customer: CustomerProfile;
		timestamp: string;
	} | null>(null);

	// Product Search & Add Form state
	const [entryMode, setEntryMode] = useState<"catalog" | "custom">("catalog");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [selectedBikeModel, setSelectedBikeModel] = useState<string>("Honda CD70");
	const [selectedPricingTier, setSelectedPricingTier] = useState<"Retail" | "Wholesale">("Wholesale");
	const [inputQuantity, setInputQuantity] = useState<number>(1);
	const [customPartName, setCustomPartName] = useState("");
	const [customRate, setCustomRate] = useState<number>(500);

	// Financials & Register
	const [discountValue, setDiscountValue] = useState<number>(0);
	const [shippingOrFitting, setShippingOrFitting] = useState<number>(0);
	const [cashReceived, setCashReceived] = useState<number>(4020);
	const [successNotice, setSuccessNotice] = useState<string | null>(null);

	// Invoice Sheet Modal
	const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<OrderRecord | null>(null);
	const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

	// Clock display
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
				quantity: inputQuantity > 0 ? inputQuantity : 1,
				unit: product.unit,
				branchStock: stock,
				pricingTier: selectedPricingTier,
			};
			return [newItem, ...prev];
		});

		setSearchQuery("");
		setInputQuantity(1);
		showFlashNotice(`Added "${product.name}" to cart`);
	};

	// Add custom item
	const handleAddCustomItem = () => {
		if (!customPartName.trim()) return;

		const newItem: CounterCartItem = {
			id: `cart-custom-${Date.now()}`,
			name: customPartName.trim(),
			bikeModel: selectedBikeModel,
			category: "Counter Custom Part",
			rate: customRate || 0,
			retailRate: customRate || 0,
			wholesaleRate: Math.round((customRate || 0) * 0.9),
			quantity: inputQuantity > 0 ? inputQuantity : 1,
			unit: "Pcs",
			branchStock: 50,
			pricingTier: selectedPricingTier,
		};

		setCart((prev) => [newItem, ...prev]);
		setCustomPartName("");
		setInputQuantity(1);
		showFlashNotice(`Added custom item "${newItem.name}"`);
	};

	// Add from Quick Common Chips
	const handleAddCommonItem = (item: (typeof COMMON_COUNTER_ITEMS)[0]) => {
		const rate =
			selectedPricingTier === "Retail" ? item.retailPrice : item.wholesalePrice;

		setCart((prev) => {
			const existingIndex = prev.findIndex(
				(ci) => ci.name === item.name && ci.bikeModel === item.bikeModel
			);
			if (existingIndex > -1) {
				const updated = [...prev];
				updated[existingIndex] = {
					...updated[existingIndex],
					quantity: updated[existingIndex].quantity + 1,
				};
				return updated;
			}
			const newItem: CounterCartItem = {
				id: `cart-chip-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
				name: item.name,
				bikeModel: item.bikeModel,
				category: item.category,
				rate: rate,
				retailRate: item.retailPrice,
				wholesaleRate: item.wholesalePrice,
				quantity: 1,
				unit: item.unit,
				branchStock: 30,
				pricingTier: selectedPricingTier,
			};
			return [newItem, ...prev];
		});

		showFlashNotice(`Added "${item.name}"`);
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
		if (confirm("Clear current counter bill?")) {
			setCart([]);
			setDiscountValue(0);
			setShippingOrFitting(0);
			setCashReceived(0);
			showFlashNotice("Counter bill cleared");
		}
	};

	// Park and unpark cart
	const handleParkCart = () => {
		if (cart.length === 0) return;
		setParkedCart({
			cart,
			customer,
			timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
		});
		setCart([]);
		showFlashNotice("Cart parked / held. Counter is ready for next customer.");
	};

	const handleRecallParkedCart = () => {
		if (!parkedCart) return;
		setCart(parkedCart.cart);
		setCustomer(parkedCart.customer);
		setParkedCart(null);
		showFlashNotice("Parked cart restored to counter.");
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

	// Auto match cash received when empty or initially loading
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
			remarks: customerNotes || "Counter Spot Sale. 7 Days Checking Warranty.",
		};

		setActiveInvoiceOrder(generatedOrder);

		if (action === "print") {
			setIsInvoiceOpen(true);
		} else {
			showFlashNotice(`Order ${generatedOrder.invoiceNumber} recorded successfully!`);
			setCart([]);
			setDiscountValue(0);
			setShippingOrFitting(0);
			setCustomerNotes("");
		}
	};

	return (
		<div className="flex flex-col gap-5 w-full max-w-[1600px] mx-auto pb-16">
			{/* TOP BAR: BRANCH SELECTOR, LIVE STATUS & COUNTER CONTROLS */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				{/* Left: Branch Indicator & Selector */}
				<div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
					<div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<Store className="size-5" />
					</div>
					<div>
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

						{/* Branch Dropdown */}
						<div className="flex items-center gap-2 mt-1">
							<select
								value={activeBranchId}
								onChange={(e) => handleBranchChange(e.target.value as BranchId)}
								className="font-heading font-bold text-base sm:text-lg text-foreground bg-transparent border-b-2 border-primary/40 focus:border-primary focus:outline-none cursor-pointer py-0.5 pr-2"
							>
								{BRANCHES.map((b) => (
									<option key={b.id} value={b.id} className="bg-popover text-foreground">
										{b.name}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{/* Center: Branch Details snippet */}
				<div className="hidden xl:flex items-center gap-6 text-xs text-muted-foreground border-x px-6">
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
						<p className="font-medium text-foreground">{currentBranch.phone}</p>
					</div>
				</div>

				{/* Right: Clock & Quick Parked / Action controls */}
				<div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
					{parkedCart ? (
						<Button
							variant="outline"
							size="sm"
							onClick={handleRecallParkedCart}
							className="h-8 px-2.5 text-xs border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 gap-1.5 cursor-pointer font-medium animate-pulse"
						>
							<PlayCircle className="size-3.5" />
							<span>Recall Held Bill ({parkedCart.cart.length} items)</span>
						</Button>
					) : (
						<Button
							variant="outline"
							size="sm"
							disabled={cart.length === 0}
							onClick={handleParkCart}
							className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer font-medium text-muted-foreground hover:text-foreground"
						>
							<PauseCircle className="size-3.5" />
							<span>Hold Bill</span>
						</Button>
					)}

					<div className="flex items-center gap-2 bg-muted/40 border px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-foreground">
						<Clock className="size-3.5 text-primary" />
						<span>{currentTime || "12:00:00 PM"}</span>
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={clearCart}
						disabled={cart.length === 0}
						className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1 cursor-pointer"
					>
						<RotateCcw className="size-3.5" />
						<span className="hidden sm:inline">New Bill</span>
					</Button>
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
						{/* Tabs: Existing Catalog vs Custom Part Entry */}
						<div className="flex items-center justify-between border-b pb-3 gap-2">
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setEntryMode("catalog")}
									className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
										entryMode === "catalog"
											? "bg-primary text-primary-foreground shadow-xs"
											: "text-muted-foreground hover:text-foreground hover:bg-muted"
									}`}
								>
									Inventory Catalog
								</button>
								<button
									type="button"
									onClick={() => setEntryMode("custom")}
									className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
										entryMode === "custom"
											? "bg-primary text-primary-foreground shadow-xs"
											: "text-muted-foreground hover:text-foreground hover:bg-muted"
									}`}
								>
									+ Custom / New Part
								</button>
							</div>

							{/* Pricing Tier Toggle (Retail vs Wholesale) */}
							<div className="flex items-center gap-1.5 bg-muted/60 p-0.5 rounded-lg border">
								<button
									type="button"
									onClick={() => setSelectedPricingTier("Wholesale")}
									className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
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
									className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
										selectedPricingTier === "Retail"
											? "bg-background text-foreground shadow-xs"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									Retail
								</button>
							</div>
						</div>

						{/* Bike Model & Filters Row */}
						<div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
							{/* Bike Model Selector */}
							<div className="sm:col-span-6 space-y-1">
								<label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
									<Bike className="size-3 text-primary" />
									Target Bike Model:
								</label>
								<select
									value={selectedBikeModel}
									onChange={(e) => setSelectedBikeModel(e.target.value)}
									className="w-full h-9 rounded-lg border bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
								>
									<option value="All Models">All Models / Universal</option>
									{BIKE_MODELS.map((model) => (
										<option key={model} value={model}>
											{model}
										</option>
									))}
								</select>
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

							{/* Category Filter (if Catalog mode) */}
							<div className="sm:col-span-3 space-y-1">
								<label className="text-[11px] font-semibold text-muted-foreground">
									Category:
								</label>
								<select
									value={selectedCategory}
									onChange={(e) => setSelectedCategory(e.target.value)}
									className="w-full h-9 rounded-lg border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer truncate"
								>
									<option value="All">All Categories</option>
									<option value="Engine & Transmission">Engine & Transmission</option>
									<option value="Electrical & Lighting">Electrical & Lighting</option>
									<option value="Brakes & Suspension">Brakes & Suspension</option>
									<option value="Chassis & Body">Chassis & Body</option>
									<option value="Cables & Control">Cables & Control</option>
									<option value="Tyres & Wheels">Tyres & Wheels</option>
								</select>
							</div>
						</div>

						{/* INPUT BAR BASED ON MODE */}
						{entryMode === "catalog" ? (
							<div className="space-y-2">
								<div className="relative">
									<Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
									<Input
										placeholder="Type part name or SKU (e.g. Piston, Clutch, Chain, Sleeve)..."
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
									<div className="rounded-xl border bg-popover shadow-lg max-h-60 overflow-y-auto divide-y divide-border">
										{matchingProducts.length === 0 ? (
											<div className="p-4 text-center text-xs text-muted-foreground">
												No matching product found in catalog. Switch to{" "}
												<button
													type="button"
													onClick={() => {
														setCustomPartName(searchQuery);
														setEntryMode("custom");
													}}
													className="text-primary font-semibold underline cursor-pointer"
												>
													+ Custom Part
												</button>{" "}
												to add directly.
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
														className="p-2.5 hover:bg-muted/50 flex items-center justify-between gap-3 transition-colors cursor-pointer"
														onClick={() => handleAddCatalogItem(prod)}
													>
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
						) : (
							/* Custom Part Direct Entry */
							<div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
								<div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
									<div className="sm:col-span-7 space-y-1">
										<label className="text-[11px] font-semibold text-foreground">
											New / Custom Part Name:
										</label>
										<Input
											placeholder="e.g. Front Shock Oil Seal Special (OEM)"
											value={customPartName}
											onChange={(e) => setCustomPartName(e.target.value)}
											className="h-9 text-xs bg-background"
										/>
									</div>
									<div className="sm:col-span-5 space-y-1">
										<label className="text-[11px] font-semibold text-foreground">
											Counter Rate (PKR Rs.):
										</label>
										<div className="relative">
											<span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground">
												Rs.
											</span>
											<Input
												type="number"
												min={0}
												value={customRate}
												onChange={(e) => setCustomRate(Math.max(0, parseInt(e.target.value) || 0))}
												className="pl-9 h-9 text-xs font-semibold bg-background"
											/>
										</div>
									</div>
								</div>

								<div className="flex items-center justify-between pt-1">
									<p className="text-[11px] text-muted-foreground">
										Assigns to <strong className="text-foreground">{selectedBikeModel}</strong> at{" "}
										<strong className="text-foreground">{selectedPricingTier}</strong> rate.
									</p>
									<Button
										size="sm"
										onClick={handleAddCustomItem}
										disabled={!customPartName.trim()}
										className="h-8 px-4 text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground"
									>
										<Plus className="size-3.5" />
										Add Custom Part
									</Button>
								</div>
							</div>
						)}

						{/* Quick Spare Part Chips (Fast-click counter shelf) */}
						<div className="pt-2 border-t">
							<div className="flex items-center justify-between mb-2">
								<span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
									<Sparkles className="size-3 text-amber-500" />
									High Velocity Counter Parts (1-Click Add):
								</span>
								<span className="text-[10px] text-muted-foreground font-mono">
									Prices auto-adjust for {selectedPricingTier}
								</span>
							</div>

							<div className="flex flex-wrap gap-1.5">
								{COMMON_COUNTER_ITEMS.map((item) => (
									<button
										key={item.name}
										type="button"
										onClick={() => handleAddCommonItem(item)}
										className="px-2.5 py-1 rounded-lg border bg-background hover:bg-muted/80 text-[11px] font-medium text-foreground flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:border-primary/50"
									>
										<span>{item.name}</span>
										<span className="text-[10px] font-semibold text-primary">
											Rs.{" "}
											{selectedPricingTier === "Retail"
												? item.retailPrice
												: item.wholesalePrice}
										</span>
										<Plus className="size-2.5 text-muted-foreground" />
									</button>
								))}
							</div>
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
													Search products above, pick a fast-item chip, or type a custom part to build an invoice.
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

													{/* Product Name & Model selection */}
													<td className="py-3 px-3">
														<div className="font-semibold text-foreground leading-snug">
															{item.name}
														</div>
														<div className="flex items-center gap-2 mt-1">
															{/* Inline Bike Model Dropdown */}
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
																className="w-16 h-7 px-1.5 font-mono font-bold text-xs rounded border bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
															/>
														</div>
														<span className="text-[10px] text-muted-foreground block mt-0.5">
															{item.pricingTier} Rate
														</span>
													</td>

													{/* Quantity +/- controls */}
													<td className="py-3 px-3 text-center">
														<div className="inline-flex items-center border rounded-lg overflow-hidden bg-background h-7">
															<button
																type="button"
																onClick={() => updateQuantity(item.id, -1)}
																className="px-2 h-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
															>
																<Minus className="size-3" />
															</button>
															<span className="w-8 text-center font-mono font-bold text-xs text-foreground">
																{item.quantity}
															</span>
															<button
																type="button"
																onClick={() => updateQuantity(item.id, 1)}
																className="px-2 h-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
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
								Customer & Counter Account
							</h3>
							<Badge variant="outline" className="text-[10px] font-semibold">
								{customer.type}
							</Badge>
						</div>

						{/* Frequent Customers Quick Picker */}
						<div className="space-y-1">
							<span className="text-[11px] font-semibold text-muted-foreground block">
								Quick Select Customer:
							</span>
							<div className="flex flex-wrap gap-1.5">
								{FREQUENT_CUSTOMERS.map((cust) => (
									<button
										key={cust.name}
										type="button"
										onClick={() => {
											setCustomer(cust);
											if (cust.type.includes("Wholesale")) {
												setSelectedPricingTier("Wholesale");
											} else {
												setSelectedPricingTier("Retail");
											}
										}}
										className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
											customer.name === cust.name
												? "bg-primary/10 border-primary text-primary font-bold shadow-2xs"
												: "bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
										}`}
									>
										{cust.name}
									</button>
								))}
							</div>
						</div>

						{/* Customer Details Form */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
							<div className="space-y-1">
								<label className="text-[11px] font-semibold text-muted-foreground">
									Customer / Shop Name:
								</label>
								<Input
									value={customer.name}
									onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
									className="h-8 text-xs bg-background"
									placeholder="e.g. Afraz Autos"
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

							<div className="space-y-1">
								<label className="text-[11px] font-semibold text-muted-foreground">
									Payment Terms:
								</label>
								<select
									value={customer.paymentMethod}
									onChange={(e) =>
										setCustomer({
											...customer,
											paymentMethod: e.target.value as CustomerProfile["paymentMethod"],
										})
									}
									className="w-full h-8 rounded-lg border bg-background px-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
								>
									<option value="Cash on Counter">Cash on Counter</option>
									<option value="Online Transfer">Online Transfer (EasyPaisa/JazzCash/Bank)</option>
									<option value="Credit / Khata">Credit / Khata Ledger</option>
								</select>
							</div>
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

							{/* CASH TENDER & CHANGE CALCULATION */}
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

								{/* Quick Cash Bills Shortcuts */}
								<div className="flex items-center justify-end gap-1.5">
									<button
										type="button"
										onClick={() => setCashReceived(netBill)}
										className="px-2 py-0.5 rounded border text-[10px] font-semibold bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
									>
										Exact
									</button>
									<button
										type="button"
										onClick={() => setCashReceived(Math.ceil(netBill / 500) * 500 || 500)}
										className="px-2 py-0.5 rounded border text-[10px] font-semibold bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
									>
										Round 500
									</button>
									<button
										type="button"
										onClick={() => setCashReceived(Math.ceil(netBill / 1000) * 1000 || 1000)}
										className="px-2 py-0.5 rounded border text-[10px] font-semibold bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
									>
										Round 1000
									</button>
									<button
										type="button"
										onClick={() => setCashReceived((c) => c + 5000)}
										className="px-2 py-0.5 rounded border text-[10px] font-semibold bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
									>
										+5000 Note
									</button>
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
											{changeReturn >= 0 ? "Change Due (Return to Customer):" : "Remaining Balance (Credit):"}
										</span>
										<span className="text-[10px] opacity-80">
											{changeReturn >= 0 ? "Hand over change" : "Will post to Khata balance"}
										</span>
									</div>
									<span className="font-mono font-black text-xl">
										Rs. {Math.abs(changeReturn).toLocaleString()}
									</span>
								</div>
							</div>

							{/* Bill Remarks / Notes */}
							<div className="pt-1">
								<label className="text-[11px] font-semibold text-muted-foreground block mb-1">
									Invoice Notes (Printed on Receipt):
								</label>
								<Input
									value={customerNotes}
									onChange={(e) => setCustomerNotes(e.target.value)}
									placeholder="e.g. 7 days checking warranty. Mechanics fitting."
									className="h-8 text-xs bg-background"
								/>
							</div>
						</div>

						{/* INVOICE ACTION BUTTONS */}
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

							<div className="grid grid-cols-2 gap-2">
								<Button
									variant="outline"
									onClick={() => handleCreateInvoice("save")}
									disabled={cart.length === 0}
									className="h-9 text-xs font-semibold gap-1.5 cursor-pointer text-foreground"
								>
									<Check className="size-3.5 text-emerald-600" />
									<span>Save Order (No Print)</span>
								</Button>

								<Button
									variant="outline"
									onClick={handleParkCart}
									disabled={cart.length === 0}
									className="h-9 text-xs font-semibold gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
								>
									<PauseCircle className="size-3.5" />
									<span>Hold / Park Bill</span>
								</Button>
							</div>
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
