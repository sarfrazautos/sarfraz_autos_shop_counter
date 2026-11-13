"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
	Package,
	Plus,
	Check,
	ArrowLeft,
	Bike,
	Tag,
	Store,
	Building2,
	MapPin,
	DollarSign,
	Palette,
	RefreshCw,
	Eye,
	CheckCircle2,
	HelpCircle,
	Boxes,
	ChevronRight,
	X,
	Barcode,
	PencilLine,
	ShieldCheck,
	TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { INITIAL_PRODUCTS, type ProductType, type ProductCategory } from "./types";

// Common Bike Displacements & Models
const AVAILABLE_ENGINE_MODELS = [
	{ id: "70cc", label: "70cc", category: "Engine Capacity" },
	{ id: "100cc", label: "100cc", category: "Engine Capacity" },
	{ id: "110cc", label: "110cc", category: "Engine Capacity" },
	{ id: "125cc", label: "125cc", category: "Engine Capacity" },
	{ id: "150cc", label: "150cc", category: "Engine Capacity" },
	{ id: "200cc", label: "200cc", category: "Engine Capacity" },
	{ id: "Universal", label: "Universal Fit", category: "Engine Capacity" },
	{ id: "Honda CD70", label: "Honda CD70", category: "Popular Motorcycle" },
	{ id: "Honda CG125", label: "Honda CG125", category: "Popular Motorcycle" },
	{ id: "Honda CD70 Dream", label: "Honda CD70 Dream", category: "Popular Motorcycle" },
	{ id: "Honda Pridor 100", label: "Honda Pridor 100", category: "Popular Motorcycle" },
	{ id: "Suzuki GS150", label: "Suzuki GS150", category: "Popular Motorcycle" },
	{ id: "Yamaha YBR125", label: "Yamaha YBR125", category: "Popular Motorcycle" },
	{ id: "Road Prince 70", label: "Road Prince 70", category: "Popular Motorcycle" },
];

// Color choices with swatches
const AVAILABLE_COLORS = [
	{ name: "Black", hex: "#18181b", border: "border-zinc-700" },
	{ name: "Red", hex: "#dc2626", border: "border-red-600" },
	{ name: "Silver / Chrome", hex: "#94a3b8", border: "border-slate-400" },
	{ name: "Blue", hex: "#2563eb", border: "border-blue-600" },
	{ name: "Golden", hex: "#d97706", border: "border-amber-600" },
	{ name: "Matte Grey", hex: "#475569", border: "border-slate-600" },
	{ name: "White", hex: "#f8fafc", border: "border-slate-300" },
	{ name: "Green", hex: "#16a34a", border: "border-emerald-600" },
];

// Brands in motorcycle spare parts
const POPULAR_BRANDS = [
	"Crown",
	"Honda Genuine",
	"Atlas Honda",
	"Lifan",
	"Road Prince",
	"Unique",
	"United",
	"Universal / OEM",
];

const CATEGORIES: ProductCategory[] = [
	"Engine & Transmission",
	"Electrical & Lighting",
	"Brakes & Suspension",
	"Chassis & Body",
	"Cables & Control",
	"Tyres & Wheels",
];

export function AddProductForm() {
	// Core form fields
	const [productName, setProductName] = useState("Crown High-Performance CD70 Piston Kit");
	const [listingType, setListingType] = useState<ProductType>("Wholesale");
	const [brandName, setBrandName] = useState("Crown");
	const [category, setCategory] = useState<ProductCategory>("Engine & Transmission");
	const [sku, setSku] = useState("CRN-70CC-842");

	// Multi-select bike models (70cc, 100cc, 110cc, etc.)
	const [selectedModels, setSelectedModels] = useState<string[]>(["70cc", "100cc", "Honda CD70"]);

	// Multi-select colors
	const [selectedColors, setSelectedColors] = useState<string[]>(["Silver / Chrome", "Black"]);

	// Pricing:
	// 1. Cost Price = What the shop bought it for from supplier (خریداری ریٹ)
	// 2. Retail Price = Selling price for normal walk-in customer (گاہک ریٹ)
	// 3. Wholesale Price = Discounted price for mechanics & bulk buyers (ہول سیل ریٹ)
	const [costPrice, setCostPrice] = useState<number>(1100);
	const [retailPrice, setRetailPrice] = useState<number>(1450);
	const [wholesalePrice, setWholesalePrice] = useState<number>(1280);

	// Stock & Inventory
	const [stockStatus, setStockStatus] = useState<"In Stock" | "Low Stock" | "Out of Stock">("In Stock");
	const [totalStock, setTotalStock] = useState<number>(90);
	const LOW_STOCK_THRESHOLD = 15;

	// Branch stock distribution (automatically split across 3 branches)
	const [saddarStock, setSaddarStock] = useState<number>(30);
	const [gulshanStock, setGulshanStock] = useState<number>(30);
	const [dhaStock, setDhaStock] = useState<number>(30);

	// UI Loading & Submission state
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuccessBanner, setShowSuccessBanner] = useState(false);

	// Automatic Stock Distribution across 3 branches
	const autoDistributeStock = (total: number) => {
		if (total <= 0) {
			setSaddarStock(0);
			setGulshanStock(0);
			setDhaStock(0);
			return;
		}
		const base = Math.floor(total / 3);
		const remainder = total % 3;
		// Remainder distribution: 1st piece to Saddar (Main branch), 2nd piece to Gulshan
		const b1 = base + (remainder > 0 ? 1 : 0);
		const b2 = base + (remainder > 1 ? 1 : 0);
		const b3 = base;
		setSaddarStock(b1);
		setGulshanStock(b2);
		setDhaStock(b3);
	};

	// Handle Total Stock Input change with automatic branch splitting
	const handleTotalStockChange = (val: number) => {
		const safeVal = Math.max(0, val);
		setTotalStock(safeVal);

		if (safeVal === 0) setStockStatus("Out of Stock");
		else if (safeVal <= LOW_STOCK_THRESHOLD) setStockStatus("Low Stock");
		else setStockStatus("In Stock");

		autoDistributeStock(safeVal);
	};

	// Auto-generate smart SKU code whenever Brand or Model changes
	const generateSmartSku = (brand: string, model: string) => {
		const brandCode = (brand || "CRN").substring(0, 3).toUpperCase();
		const modelCode = (model || "70CC").replace(/\s+/g, "").substring(0, 4).toUpperCase();
		const randomNum = Math.floor(100 + Math.random() * 900);
		return `${brandCode}-${modelCode}-${randomNum}`;
	};

	// Auto-update SKU code on brand or first model change
	useEffect(() => {
		const newSku = generateSmartSku(brandName, selectedModels[0] || "70CC");
		setSku(newSku);
	}, [brandName, selectedModels]);

	// Toggle bike model tag
	const toggleBikeModel = (modelId: string) => {
		setSelectedModels((prev) =>
			prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
		);
	};

	// Toggle color swatch
	const toggleColor = (colorName: string) => {
		setSelectedColors((prev) =>
			prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
		);
	};

	// Form Submit handler
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setShowSuccessBanner(false);

		// Simulate API call with realistic latency
		setTimeout(() => {
			setIsSubmitting(false);
			setShowSuccessBanner(true);
		}, 1200);
	};

	// Profit Calculations
	const retailProfit = retailPrice - costPrice;
	const wholesaleProfit = wholesalePrice - costPrice;
	const retailMarginPercent = costPrice > 0 ? Math.round((retailProfit / costPrice) * 100) : 0;
	const wholesaleMarginPercent = costPrice > 0 ? Math.round((wholesaleProfit / costPrice) * 100) : 0;

	return (
		<div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-16">
			{/* Breadcrumb & Top Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<Link
						href="/dashboard/products"
						className="hover:text-foreground transition-colors flex items-center gap-1 font-medium"
					>
						<ArrowLeft className="size-3.5" />
						All Products
					</Link>
					<ChevronRight className="size-3 text-muted-foreground/50" />
					<span className="text-foreground font-semibold">
						Add New Product
					</span>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="text-xs text-muted-foreground hover:text-foreground"
						render={<Link href="/dashboard/products" />}
						nativeButton={false}
					>
						Cancel
					</Button>
				</div>
			</div>

			{/* Success Notification Banner */}
			{showSuccessBanner && (
				<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
					<div className="flex items-center gap-3">
						<div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
							<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<div>
							<h4 className="font-semibold text-sm">
								Product Created Successfully!
							</h4>
							<p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
								<strong>{productName}</strong> ({sku}) has been saved with automatic branch distribution.
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2 self-end sm:self-auto">
						<Button
							size="sm"
							variant="outline"
							onClick={() => setShowSuccessBanner(false)}
							className="text-xs border-emerald-500/30 bg-background"
						>
							Dismiss
						</Button>
						<Button
							size="sm"
							className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
							render={<Link href="/dashboard/products" />}
							nativeButton={false}
						>
							View in Inventory
						</Button>
					</div>
				</div>
			)}

			{/* Page Heading */}
			<div>
				<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
					Add New Spare Part
				</h1>
				<p className="text-xs text-muted-foreground mt-1">
					Configure spare part catalog specifications, compatible bike models, pricing rates, and 3-branch stock levels.
				</p>
			</div>

			{/* Main Form Layout (2 Columns: Form Fields on Left, Sticky Live Preview on Right) */}
			<form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* LEFT COLUMN: Main Form Sections (8 cols) */}
				<div className="lg:col-span-8 flex flex-col gap-6">
					{/* STEP 1: General Product Info */}
					<div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
						<div className="flex items-center justify-between border-b pb-3">
							<div className="flex items-center gap-2">
								<div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
									<Package className="size-4" />
								</div>
								<div>
									<h2 className="text-sm font-semibold text-foreground">Step 1: General Information</h2>
									<p className="text-[11px] text-muted-foreground">Product title, listing type, brand, and category</p>
								</div>
							</div>
							<span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
								Step 1 of 4
							</span>
						</div>

						{/* Product Name */}
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-foreground flex items-center justify-between">
								<span>Product Name / Description *</span>
								<span className="text-[11px] text-muted-foreground font-normal">
									{productName.length}/100 chars
								</span>
							</label>
							<Input
								value={productName}
								onChange={(e) => setProductName(e.target.value)}
								placeholder="e.g. Crown CD70 Cylinder Kit Standard 47mm"
								required
								className="h-9 text-sm"
							/>
						</div>

						{/* Listing Type Selection (Wholesale, Retail, Both) */}
						<div className="space-y-2">
							<label className="text-xs font-medium text-foreground flex items-center gap-1.5">
								<Tag className="size-3.5 text-primary" />
								<span>Listing Type *</span>
								<span className="text-[11px] text-muted-foreground font-normal">
									(Who can purchase this listing?)
								</span>
							</label>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								{/* Wholesale Option */}
								<div
									onClick={() => setListingType("Wholesale")}
									className={`cursor-pointer rounded-lg border p-3 flex flex-col justify-between transition-all ${
										listingType === "Wholesale"
											? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20"
											: "border-border hover:border-muted-foreground/30 bg-card"
									}`}
								>
									<div className="flex items-center justify-between mb-1.5">
										<Badge
											variant="outline"
											className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 font-semibold text-[11px]"
										>
											Wholesale
										</Badge>
										{listingType === "Wholesale" && <Check className="size-4 text-blue-600" />}
									</div>
									<p className="text-[11px] text-muted-foreground leading-snug">
										Discounted rates for dealers, repair shops, and mechanics.
									</p>
								</div>

								{/* Retail Option */}
								<div
									onClick={() => setListingType("Retail")}
									className={`cursor-pointer rounded-lg border p-3 flex flex-col justify-between transition-all ${
										listingType === "Retail"
											? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 ring-2 ring-purple-500/20"
											: "border-border hover:border-muted-foreground/30 bg-card"
									}`}
								>
									<div className="flex items-center justify-between mb-1.5">
										<Badge
											variant="outline"
											className="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 font-semibold text-[11px]"
										>
											Retail
										</Badge>
										{listingType === "Retail" && <Check className="size-4 text-purple-600" />}
									</div>
									<p className="text-[11px] text-muted-foreground leading-snug">
										Standard counter walk-in price for individual motorcycle owners.
									</p>
								</div>

								{/* Both Option */}
								<div
									onClick={() => setListingType("Both")}
									className={`cursor-pointer rounded-lg border p-3 flex flex-col justify-between transition-all ${
										listingType === "Both"
											? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
											: "border-border hover:border-muted-foreground/30 bg-card"
									}`}
								>
									<div className="flex items-center justify-between mb-1.5">
										<Badge
											variant="outline"
											className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold text-[11px]"
										>
											Both (Universal)
										</Badge>
										{listingType === "Both" && <Check className="size-4 text-emerald-600" />}
									</div>
									<p className="text-[11px] text-muted-foreground leading-snug">
										Available on counter as retail, and eligible for bulk dealer invoices.
									</p>
								</div>
							</div>
						</div>

						{/* Brand & Category Grid (Full 100% width triggers) */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
							{/* Brand Selection (100% width, no custom brand input) */}
							<div className="space-y-1.5">
								<label className="text-xs font-medium text-foreground flex items-center justify-between">
									<span>Brand Name *</span>
									<span className="text-[10px] text-muted-foreground">Manufacturer</span>
								</label>
								<Select
									value={brandName}
									onValueChange={(val) => {
										if (val) setBrandName(val);
									}}
								>
									<SelectTrigger className="h-9 text-xs w-full">
										<SelectValue placeholder="Select Brand..." />
									</SelectTrigger>
									<SelectContent>
										{POPULAR_BRANDS.map((b) => (
											<SelectItem key={b} value={b} className="text-xs">
												{b}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Category (100% width) */}
							<div className="space-y-1.5">
								<label className="text-xs font-medium text-foreground">Category *</label>
								<Select
									value={category}
									onValueChange={(val) => {
										if (val) setCategory(val as ProductCategory);
									}}
								>
									<SelectTrigger className="h-9 text-xs w-full">
										<SelectValue placeholder="Select Category..." />
									</SelectTrigger>
									<SelectContent>
										{CATEGORIES.map((c) => (
											<SelectItem key={c} value={c} className="text-xs">
												{c}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Part SKU Code (Low opacity auto-generated display text, no manual input needed) */}
						<div className="pt-1">
							<div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between">
								<div className="flex items-center gap-2.5">
									<Barcode className="size-4 text-muted-foreground/50 shrink-0" />
									<div>
										<span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold block">
											System Auto-Generated SKU Code
										</span>
										<span className="font-mono text-xs font-semibold text-muted-foreground/80 tracking-wider">
											{sku}
										</span>
									</div>
								</div>
								<Badge
									variant="outline"
									className="text-[10px] font-mono text-muted-foreground/60 border-muted-foreground/20 bg-background/50"
								>
									Automatic
								</Badge>
							</div>
						</div>
					</div>

					{/* STEP 2: Bike Compatibility & Colors */}
					<div className="rounded-xl border bg-card p-5 shadow-xs space-y-5">
						<div className="flex items-center justify-between border-b pb-3">
							<div className="flex items-center gap-2">
								<div className="size-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
									<Bike className="size-4" />
								</div>
								<div>
									<h2 className="text-sm font-semibold text-foreground">
										Step 2: Compatible Bike Models & Colors
									</h2>
									<p className="text-[11px] text-muted-foreground">
										Select multiple engine sizes (70cc, 100cc, 110cc...) and available finishes
									</p>
								</div>
							</div>
							<span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
								Step 2 of 4
							</span>
						</div>

						{/* Multi-Select Bike Engine Displacement / Models */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<label className="text-xs font-medium text-foreground flex items-center gap-1.5">
									<Bike className="size-3.5 text-primary" />
									<span>Compatible Bike Models *</span>
									<span className="text-[11px] text-muted-foreground font-normal">
										(Select multiple: 70cc, 100cc, 110cc, etc.)
									</span>
								</label>
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => setSelectedModels(["70cc", "100cc", "110cc", "125cc"])}
										className="text-[11px] text-primary hover:underline cursor-pointer"
									>
										Select Common
									</button>
									<span className="text-muted-foreground text-xs">•</span>
									<button
										type="button"
										onClick={() => setSelectedModels([])}
										className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
									>
										Clear
									</button>
								</div>
							</div>

							{/* Interactive Tags for Engine Displacements */}
							<div className="space-y-1.5">
								<p className="text-[11px] font-medium text-muted-foreground">
									Engine Capacities / CC Ratings:
								</p>
								<div className="flex flex-wrap gap-2">
									{AVAILABLE_ENGINE_MODELS.filter((m) => m.category === "Engine Capacity").map((m) => {
										const isSelected = selectedModels.includes(m.id);
										return (
											<button
												key={m.id}
												type="button"
												onClick={() => toggleBikeModel(m.id)}
												className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
													isSelected
														? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold ring-2 ring-primary/20"
														: "bg-muted/50 hover:bg-muted text-foreground border-border hover:border-muted-foreground/30"
												}`}
											>
												{isSelected && <Check className="size-3 stroke-[3]" />}
												<span>{m.label}</span>
											</button>
										);
									})}
								</div>
							</div>

							{/* Popular Specific Motorcycles */}
							<div className="space-y-1.5 pt-2">
								<p className="text-[11px] font-medium text-muted-foreground">
									Popular Bike Models in Pakistan:
								</p>
								<div className="flex flex-wrap gap-2">
									{AVAILABLE_ENGINE_MODELS.filter((m) => m.category === "Popular Motorcycle").map((m) => {
										const isSelected = selectedModels.includes(m.id);
										return (
											<button
												key={m.id}
												type="button"
												onClick={() => toggleBikeModel(m.id)}
												className={`cursor-pointer px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1.5 border ${
													isSelected
														? "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 font-semibold"
														: "bg-background hover:bg-muted/50 text-muted-foreground border-border"
												}`}
											>
												{isSelected && <Check className="size-3 text-sky-600 dark:text-sky-400 stroke-[3]" />}
												<span>{m.label}</span>
											</button>
										);
									})}
								</div>
							</div>

							{/* Selected models summary pills */}
							<div className="flex flex-wrap items-center gap-1.5 pt-1">
								<span className="text-[11px] text-muted-foreground mr-1">Active for:</span>
								{selectedModels.length === 0 ? (
									<span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
										No bike models selected yet (Please select at least one)
									</span>
								) : (
									selectedModels.map((sm) => (
										<span
											key={sm}
											className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-medium px-2 py-0.5 rounded-full border border-primary/20"
										>
											{sm}
											<button
												type="button"
												onClick={() => toggleBikeModel(sm)}
												className="hover:text-rose-500 cursor-pointer"
											>
												<X className="size-2.5" />
											</button>
										</span>
									))
								)}
							</div>
						</div>

						{/* Color Selection (Multi-select swatches) */}
						<div className="space-y-2.5 pt-3 border-t">
							<div className="flex items-center justify-between">
								<label className="text-xs font-medium text-foreground flex items-center gap-1.5">
									<Palette className="size-3.5 text-primary" />
									<span>Available Colors / Finishes</span>
									<span className="text-[11px] text-muted-foreground font-normal">
										(Select colors available in stock)
									</span>
								</label>
								<span className="text-[11px] text-muted-foreground">
									{selectedColors.length} selected
								</span>
							</div>

							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
								{AVAILABLE_COLORS.map((col) => {
									const isSelected = selectedColors.includes(col.name);
									return (
										<button
											key={col.name}
											type="button"
											onClick={() => toggleColor(col.name)}
											className={`cursor-pointer p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
												isSelected
													? "border-primary bg-primary/5 ring-1 ring-primary/30"
													: "border-border hover:border-muted-foreground/30 bg-card"
											}`}
										>
											<div className="flex items-center gap-2">
												<span
													className={`size-4 rounded-full border shrink-0 ${col.border}`}
													style={{ backgroundColor: col.hex }}
												/>
												<span className="text-xs font-medium text-foreground truncate">
													{col.name}
												</span>
											</div>
											{isSelected && <Check className="size-3.5 text-primary stroke-[3] shrink-0" />}
										</button>
									);
								})}
							</div>
						</div>
					</div>

					{/* STEP 3: Clear Pricing & Rates (Clearly explains Cost Price, Retail Price, Wholesale Price) */}
					<div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
						<div className="flex items-center justify-between border-b pb-3">
							<div className="flex items-center gap-2">
								<div className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
									<DollarSign className="size-4" />
								</div>
								<div>
									<h2 className="text-sm font-semibold text-foreground">Step 3: Pricing & Rates</h2>
									<p className="text-[11px] text-muted-foreground">
										Clear breakdown of purchase cost, walk-in retail price, and bulk wholesale discount
									</p>
								</div>
							</div>
							<span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
								Step 3 of 4
							</span>
						</div>

						{/* 3 Clear Pricing Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							{/* 1. Cost Price (خریداری ریٹ) */}
							<div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-foreground">
										1. Cost Price (خریداری ریٹ) *
									</span>
									<span className="text-[10px] text-muted-foreground font-mono">Shop Cost</span>
								</div>
								<p className="text-[10px] text-muted-foreground leading-snug">
									The actual price Sarfraz Autos paid to purchase this part from factory / supplier.
								</p>
								<div className="relative pt-1">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
										Rs.
									</span>
									<Input
										type="number"
										value={costPrice || ""}
										onChange={(e) => setCostPrice(Number(e.target.value))}
										placeholder="1100"
										required
										className="pl-9 h-9 font-mono text-sm bg-background"
									/>
								</div>
							</div>

							{/* 2. Retail Price (گاہک ریٹ) */}
							<div className="p-3.5 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
										2. Retail Price (گاہک ریٹ) *
									</span>
									<span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">Walk-in</span>
								</div>
								<p className="text-[10px] text-muted-foreground leading-snug">
									The normal counter sale price charged to end customers visiting the shop.
								</p>
								<div className="relative pt-1">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
										Rs.
									</span>
									<Input
										type="number"
										value={retailPrice || ""}
										onChange={(e) => setRetailPrice(Number(e.target.value))}
										placeholder="1450"
										required
										className="pl-9 h-9 font-mono text-sm font-bold bg-background text-foreground"
									/>
								</div>
							</div>

							{/* 3. Wholesale Price (ہول سیل ریٹ) */}
							<div className="p-3.5 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
										3. Wholesale Rate (ڈیلر ریٹ)
									</span>
									<span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">Mechanic / Dealer</span>
								</div>
								<p className="text-[10px] text-muted-foreground leading-snug">
									Discounted rate offered to mechanics, workshops, and bulk wholesale dealers.
								</p>
								<div className="relative pt-1">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
										Rs.
									</span>
									<Input
										type="number"
										value={wholesalePrice || ""}
										onChange={(e) => setWholesalePrice(Number(e.target.value))}
										placeholder="1280"
										className="pl-9 h-9 font-mono text-sm bg-background"
									/>
								</div>
							</div>
						</div>

						{/* Simple Profit Transparency Summary */}
						<div className="rounded-lg border bg-muted/40 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
							<div className="flex items-center gap-3">
								<TrendingUp className="size-4 text-emerald-600" />
								<div>
									<span className="text-muted-foreground text-[11px]">Walk-in Customer Profit: </span>
									<span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
										+Rs. {retailProfit.toLocaleString()} ({retailMarginPercent}% profit)
									</span>
								</div>
							</div>

							<div className="text-[11px] text-muted-foreground">
								Wholesale / Dealer Profit:{" "}
								<strong className="font-mono text-blue-600 dark:text-blue-400">
									+Rs. {wholesaleProfit.toLocaleString()} ({wholesaleMarginPercent}% profit)
								</strong>
							</div>
						</div>
					</div>

					{/* STEP 4: Stock Levels & 3-Branch Auto-Distribution */}
					<div className="rounded-xl border bg-card p-5 shadow-xs space-y-5">
						<div className="flex items-center justify-between border-b pb-3">
							<div className="flex items-center gap-2">
								<div className="size-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
									<Boxes className="size-4" />
								</div>
								<div>
									<h2 className="text-sm font-semibold text-foreground">
										Step 4: Available Stock & Branch Allocation
									</h2>
									<p className="text-[11px] text-muted-foreground">
										Input total stock quantity — it automatically divides equally across all 3 branches
									</p>
								</div>
							</div>
							<span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
								Step 4 of 4
							</span>
						</div>

						{/* Stock Status Pills (In Stock, Low Stock, Out of Stock) */}
						<div className="space-y-2">
							<label className="text-xs font-medium text-foreground flex items-center justify-between">
								<span>Stock Status *</span>
								<span className="text-[11px] text-muted-foreground font-normal">
									(Current availability state)
								</span>
							</label>
							<div className="grid grid-cols-3 gap-3">
								<button
									type="button"
									onClick={() => {
										setStockStatus("In Stock");
										if (totalStock === 0) handleTotalStockChange(90);
									}}
									className={`cursor-pointer rounded-lg border p-2.5 text-center flex items-center justify-center gap-2 transition-all ${
										stockStatus === "In Stock"
											? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-semibold ring-2 ring-emerald-500/20"
											: "border-border hover:border-muted-foreground/30 bg-card text-muted-foreground"
									}`}
								>
									<span className="size-2 rounded-full bg-emerald-500" />
									<span className="text-xs">In Stock</span>
									{stockStatus === "In Stock" && <Check className="size-3.5 stroke-[3]" />}
								</button>

								<button
									type="button"
									onClick={() => {
										setStockStatus("Low Stock");
										if (totalStock > LOW_STOCK_THRESHOLD) handleTotalStockChange(LOW_STOCK_THRESHOLD);
									}}
									className={`cursor-pointer rounded-lg border p-2.5 text-center flex items-center justify-center gap-2 transition-all ${
										stockStatus === "Low Stock"
											? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-semibold ring-2 ring-amber-500/20"
											: "border-border hover:border-muted-foreground/30 bg-card text-muted-foreground"
									}`}
								>
									<span className="size-2 rounded-full bg-amber-500" />
									<span className="text-xs">Low Stock</span>
									{stockStatus === "Low Stock" && <Check className="size-3.5 stroke-[3]" />}
								</button>

								<button
									type="button"
									onClick={() => {
										setStockStatus("Out of Stock");
										handleTotalStockChange(0);
									}}
									className={`cursor-pointer rounded-lg border p-2.5 text-center flex items-center justify-center gap-2 transition-all ${
										stockStatus === "Out of Stock"
											? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-semibold ring-2 ring-rose-500/20"
											: "border-border hover:border-muted-foreground/30 bg-card text-muted-foreground"
									}`}
								>
									<span className="size-2 rounded-full bg-rose-500" />
									<span className="text-xs">Out of Stock</span>
									{stockStatus === "Out of Stock" && <Check className="size-3.5 stroke-[3]" />}
								</button>
							</div>
						</div>

						{/* Total Available Quantity */}
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-foreground flex items-center justify-between">
								<span>Total Available Stock Quantity *</span>
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={() => handleTotalStockChange(90)}
										className="text-[10px] text-primary hover:underline cursor-pointer"
									>
										90 (30 each)
									</button>
									<span className="text-muted-foreground text-[10px]">•</span>
									<button
										type="button"
										onClick={() => handleTotalStockChange(100)}
										className="text-[10px] text-primary hover:underline cursor-pointer"
									>
										100
									</button>
									<span className="text-muted-foreground text-[10px]">•</span>
									<button
										type="button"
										onClick={() => handleTotalStockChange(200)}
										className="text-[10px] text-primary hover:underline cursor-pointer"
									>
										200
									</button>
								</div>
							</label>
							<div className="relative">
								<Input
									type="number"
									value={totalStock}
									onChange={(e) => handleTotalStockChange(Number(e.target.value))}
									placeholder="e.g. 90, 100, 200"
									required
									className="h-9 font-mono text-sm font-bold"
								/>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
									Pcs
								</span>
							</div>
							<p className="text-[11px] text-muted-foreground">
								Total inventory across shop. When you change this, branches below update automatically.
							</p>
						</div>

						{/* 3-Branch Breakdown (Automatically calculates 1/3 for each branch) */}
						<div className="rounded-xl border p-4 bg-muted/20 space-y-3">
							<div className="flex items-center justify-between">
								<div>
									<span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
										<Building2 className="size-3.5 text-primary" />
										3-Branch Stock Allocation (Auto-Calculated)
									</span>
									<p className="text-[10px] text-muted-foreground mt-0.5">
										Divided equally (e.g. 90 stock = 30 per branch; 100 stock = 34 in 1st branch, 33 in 2nd and 3rd).
									</p>
								</div>
								<button
									type="button"
									onClick={() => autoDistributeStock(totalStock)}
									className="text-[11px] text-primary hover:underline cursor-pointer flex items-center gap-1"
								>
									<RefreshCw className="size-3" /> Re-balance
								</button>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
								{/* Branch 1: Saddar */}
								<div className="p-3 rounded-lg border bg-card space-y-1.5">
									<div className="flex items-center justify-between text-xs font-medium text-foreground">
										<span className="flex items-center gap-1.5">
											<Store className="size-3.5 text-emerald-600" />
											1st Branch (Saddar)
										</span>
										<Badge variant="outline" className="text-[10px] font-mono">Main</Badge>
									</div>
									<Input
										type="number"
										value={saddarStock}
										onChange={(e) => setSaddarStock(Math.max(0, Number(e.target.value)))}
										className="h-8 font-mono text-xs"
									/>
									<span className="text-[10px] text-muted-foreground">Head Office Counter</span>
								</div>

								{/* Branch 2: Gulshan */}
								<div className="p-3 rounded-lg border bg-card space-y-1.5">
									<div className="flex items-center justify-between text-xs font-medium text-foreground">
										<span className="flex items-center gap-1.5">
											<Building2 className="size-3.5 text-sky-600" />
											2nd Branch (Gulshan)
										</span>
										<Badge variant="outline" className="text-[10px] font-mono">Branch 2</Badge>
									</div>
									<Input
										type="number"
										value={gulshanStock}
										onChange={(e) => setGulshanStock(Math.max(0, Number(e.target.value)))}
										className="h-8 font-mono text-xs"
									/>
									<span className="text-[10px] text-muted-foreground">Gulshan Auto Market</span>
								</div>

								{/* Branch 3: DHA */}
								<div className="p-3 rounded-lg border bg-card space-y-1.5">
									<div className="flex items-center justify-between text-xs font-medium text-foreground">
										<span className="flex items-center gap-1.5">
											<MapPin className="size-3.5 text-amber-600" />
											3rd Branch (DHA)
										</span>
										<Badge variant="outline" className="text-[10px] font-mono">Branch 3</Badge>
									</div>
									<Input
										type="number"
										value={dhaStock}
										onChange={(e) => setDhaStock(Math.max(0, Number(e.target.value)))}
										className="h-8 font-mono text-xs"
									/>
									<span className="text-[10px] text-muted-foreground">Phase 2 Branch</span>
								</div>
							</div>
						</div>

						{/* Standard Warranty Notice */}
						<div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/30 text-xs text-muted-foreground">
							<ShieldCheck className="size-4 text-emerald-600 shrink-0" />
							<span>Standard shop policy: <strong>7-Day Checking Warranty</strong> applies to this product listing.</span>
						</div>
					</div>

					{/* Bottom Actions Bar */}
					<div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							className="w-full sm:w-auto text-xs cursor-pointer"
							render={<Link href="/dashboard/products" />}
							nativeButton={false}
						>
							<ArrowLeft className="size-3.5 mr-1.5" /> Back to All Products
						</Button>

						<div className="flex items-center gap-2.5 w-full sm:w-auto">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsSubmitting(true);
									setTimeout(() => {
										setIsSubmitting(false);
										setShowSuccessBanner(true);
									}, 800);
								}}
								disabled={isSubmitting}
								className="w-full sm:w-auto text-xs cursor-pointer"
							>
								Save as Draft
							</Button>

							<Button
								type="submit"
								disabled={isSubmitting || !productName.trim()}
								className="w-full sm:w-auto text-xs font-semibold gap-2 cursor-pointer shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
							>
								{isSubmitting ? (
									<>
										<Spinner className="size-4 animate-spin" />
										<span>Saving Product...</span>
									</>
								) : (
									<>
										<CheckCircle2 className="size-4" />
										<span>Save & Publish Product</span>
									</>
								)}
							</Button>
						</div>
					</div>
				</div>

				{/* RIGHT COLUMN: Sticky Live Preview & Summary Card (4 cols) */}
				<div className="lg:col-span-4 sticky top-6 space-y-4">
					{/* Live Catalog Preview Card */}
					<div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
						<div className="flex items-center justify-between border-b pb-3">
							<span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<Eye className="size-3.5 text-primary" /> Live Card Preview
							</span>
							<Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
								POS Counter View
							</Badge>
						</div>

						{/* Mock Card Preview */}
						<div className="rounded-lg border bg-gradient-to-b from-card to-muted/20 p-4 space-y-3">
							{/* Header row: SKU & Stock Status */}
							<div className="flex items-center justify-between">
								<span className="font-mono text-xs font-semibold text-muted-foreground/80 bg-muted px-2 py-0.5 rounded">
									{sku || "SKU-AUTO"}
								</span>
								<Badge
									variant="outline"
									className={`text-xs ${
										stockStatus === "In Stock"
											? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
											: stockStatus === "Low Stock"
											? "bg-amber-500/10 text-amber-600 border-amber-500/20"
											: "bg-rose-500/10 text-rose-600 border-rose-500/20"
									}`}
								>
									{stockStatus}
								</Badge>
							</div>

							{/* Product Title */}
							<div>
								<h3 className="font-heading font-bold text-sm text-foreground leading-snug line-clamp-2">
									{productName || "Untitled Spare Part"}
								</h3>
								<div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
									<span>Brand: <strong className="text-foreground">{brandName}</strong></span>
									<span>•</span>
									<span>{category}</span>
								</div>
							</div>

							{/* Listing Type & Colors */}
							<div className="flex flex-wrap items-center gap-1.5 pt-1">
								<Badge
									variant="outline"
									className={`text-[11px] rounded-full font-medium ${
										listingType === "Wholesale"
											? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
											: listingType === "Retail"
											? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400"
											: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
									}`}
								>
									{listingType}
								</Badge>

								{/* Color Swatch Dots */}
								{selectedColors.map((colName) => {
									const c = AVAILABLE_COLORS.find((x) => x.name === colName);
									return (
										<span
											key={colName}
											title={colName}
											className="size-3.5 rounded-full border border-border shadow-2xs inline-block"
											style={{ backgroundColor: c?.hex || "#999" }}
										/>
									);
								})}
							</div>

							{/* Compatible Bike Models Tags */}
							<div className="space-y-1 pt-1 border-t border-border/50">
								<span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
									Compatible Models ({selectedModels.length}):
								</span>
								<div className="flex flex-wrap gap-1">
									{selectedModels.length === 0 ? (
										<span className="text-[11px] text-muted-foreground italic">None selected</span>
									) : (
										selectedModels.map((m) => (
											<span
												key={m}
												className="bg-muted text-foreground text-[10px] px-1.5 py-0.5 rounded font-medium"
											>
												{m}
											</span>
										))
									)}
								</div>
							</div>

							{/* Price and Stock Counter */}
							<div className="pt-2 border-t flex items-end justify-between">
								<div>
									<span className="text-[10px] text-muted-foreground block">Counter Retail</span>
									<span className="font-heading text-lg font-bold text-foreground">
										Rs. {retailPrice.toLocaleString()}
									</span>
									{wholesalePrice > 0 && (
										<span className="text-[10px] text-blue-600 dark:text-blue-400 block font-mono">
											Wholesale: Rs. {wholesalePrice.toLocaleString()}
										</span>
									)}
								</div>

								<div className="text-right">
									<span className="text-[10px] text-muted-foreground block">Available Stock</span>
									<span className="font-mono text-sm font-bold text-foreground">
										{totalStock} Pcs
									</span>
								</div>
							</div>
						</div>

						{/* Quick Branch Breakdown Box */}
						<div className="p-3 rounded-lg border bg-muted/20 space-y-1.5 text-xs">
							<span className="text-[11px] font-semibold text-muted-foreground block">
								Branch Inventory Allocation:
							</span>
							<div className="space-y-1 text-[11px]">
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground flex items-center gap-1">
										<Store className="size-3 text-emerald-600" /> Saddar (Main)
									</span>
									<span className="font-mono font-medium">{saddarStock} Pcs</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground flex items-center gap-1">
										<Building2 className="size-3 text-sky-600" /> Gulshan
									</span>
									<span className="font-mono font-medium">{gulshanStock} Pcs</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground flex items-center gap-1">
										<MapPin className="size-3 text-amber-600" /> DHA
									</span>
									<span className="font-mono font-medium">{dhaStock} Pcs</span>
								</div>
							</div>
						</div>

						{/* Warranty Badge */}
						<div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
							<ShieldCheck className="size-3.5 text-emerald-600" />
							<span>Warranty: <strong className="text-foreground">7 Days Check Warranty</strong></span>
						</div>

						{/* Submit button inside sidebar */}
						<Button
							type="submit"
							disabled={isSubmitting || !productName.trim()}
							className="w-full text-xs font-semibold gap-2 cursor-pointer shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
						>
							{isSubmitting ? (
								<>
									<Spinner className="size-4 animate-spin" />
									<span>Saving...</span>
								</>
							) : (
								<>
									<CheckCircle2 className="size-4" />
									<span>Save & Publish</span>
								</>
							)}
						</Button>
					</div>

					{/* Helpful Tips Card */}
					<div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-xs">
						<h4 className="font-semibold text-foreground flex items-center gap-1.5">
							<HelpCircle className="size-3.5 text-primary" />
							Quick Guide
						</h4>
						<ul className="list-disc list-inside text-muted-foreground space-y-1 text-[11px] leading-relaxed">
							<li>
								Selecting multiple models like <strong>70cc</strong> &amp; <strong>100cc</strong> links this part to all matching motorcycles.
							</li>
							<li>
								Entering total stock auto-splits inventory across Saddar, Gulshan, and DHA branches.
							</li>
							<li>
								Wholesale price is automatically applied for registered garage and dealer invoices.
							</li>
						</ul>
					</div>
				</div>
			</form>
		</div>
	);
}
