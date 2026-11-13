"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
	BadgeDollarSign,
	Search,
	RotateCcw,
	Filter,
	ArrowUpRight,
	ArrowDownRight,
	Percent,
	Sparkles,
	Check,
	CheckCircle2,
	Eye,
	SlidersHorizontal,
	TrendingUp,
	TrendingDown,
	Package,
	Store,
	ArrowLeft,
	HelpCircle,
	Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	INITIAL_PRODUCTS,
	type ProductItem,
	type ProductCategory,
	type ProductType,
} from "./types";

const ITEMS_PER_PAGE = 12;

const CATEGORIES: (ProductCategory | "all")[] = [
	"all",
	"Engine & Transmission",
	"Electrical & Lighting",
	"Brakes & Suspension",
	"Chassis & Body",
	"Cables & Control",
	"Tyres & Wheels",
];

const BRANDS = [
	"all",
	"Crown",
	"Honda Genuine",
	"Atlas Honda",
	"Lifan",
	"Yamaha",
	"Suzuki",
];

const BIKE_MODELS = [
	"all",
	"Honda CD70",
	"Honda CG125",
	"Honda CD70 Dream",
	"Suzuki GS150",
	"Yamaha YBR125",
	"Crown 70cc / Universal",
];

export function PriceUpdaterView() {
	// Main Products state
	const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);

	// Filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [minPrice, setMinPrice] = useState<string>("");
	const [maxPrice, setMaxPrice] = useState<string>("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedBrand, setSelectedBrand] = useState<string>("all");
	const [selectedModel, setSelectedModel] = useState<string>("all");
	const [selectedType, setSelectedType] = useState<string>("all");

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);

	// Multi-select for price update targeting
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	// Price adjustment configuration
	const [adjustmentDirection, setAdjustmentDirection] = useState<"increase" | "decrease">("increase");
	const [adjustmentType, setAdjustmentType] = useState<"percentage" | "fixed">("percentage");
	const [adjustmentValue, setAdjustmentValue] = useState<number>(10);
	const [targetPriceField, setTargetPriceField] = useState<"both" | "retail" | "wholesale">("both");

	// Preview & Save states
	const [isPreviewActive, setIsPreviewActive] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [successBanner, setSuccessBanner] = useState<{
		count: number;
		adjustmentText: string;
	} | null>(null);

	// Filter logic
	const filteredProducts = useMemo(() => {
		return products.filter((p) => {
			// Price range check
			const min = minPrice ? Number(minPrice) : 0;
			const max = maxPrice ? Number(maxPrice) : Infinity;
			if (p.price < min || p.price > max) return false;

			// Category check
			if (selectedCategory !== "all" && p.category !== selectedCategory) return false;

			// Bike model check
			if (selectedModel !== "all" && p.bikeModel !== selectedModel) return false;

			// Type check (Wholesale / Retail / Both)
			if (selectedType !== "all") {
				if (selectedType === "Both" && p.type !== "Both") return false;
				if (selectedType === "Retail" && p.type !== "Retail" && p.type !== "Both") return false;
				if (selectedType === "Wholesale" && p.type !== "Wholesale" && p.type !== "Both") return false;
			}

			// Brand check
			if (selectedBrand !== "all") {
				const brandMatch = p.name.toLowerCase().includes(selectedBrand.toLowerCase());
				if (!brandMatch) return false;
			}

			// Search text query
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const matches =
					p.name.toLowerCase().includes(q) ||
					p.sku.toLowerCase().includes(q) ||
					p.category.toLowerCase().includes(q) ||
					p.bikeModel.toLowerCase().includes(q);
				if (!matches) return false;
			}

			return true;
		});
	}, [
		products,
		minPrice,
		maxPrice,
		selectedCategory,
		selectedBrand,
		selectedModel,
		selectedType,
		searchQuery,
	]);

	// Auto-select all filtered items when filtered list changes if desired
	const filteredIds = useMemo(() => filteredProducts.map((p) => p.id), [filteredProducts]);

	// Checkbox multi-select helpers
	const allSelected =
		filteredProducts.length > 0 &&
		filteredProducts.every((p) => selectedIds.includes(p.id));
	const someSelected =
		selectedIds.length > 0 &&
		!allSelected &&
		filteredProducts.some((p) => selectedIds.includes(p.id));

	const handleToggleSelectAll = () => {
		if (allSelected) {
			// Unselect only currently filtered items
			setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
		} else {
			// Select all currently filtered items
			setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
		}
	};

	const handleToggleSelectOne = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
		);
	};

	// Reset all filter fields
	const handleResetFilters = () => {
		setMinPrice("");
		setMaxPrice("");
		setSelectedCategory("all");
		setSelectedBrand("all");
		setSelectedModel("all");
		setSelectedType("all");
		setSearchQuery("");
		setCurrentPage(1);
		setIsPreviewActive(false);
	};

	// Calculate adjusted price for a single product
	const calculateNewPrice = (current: number) => {
		if (!isPreviewActive) return current;
		const multiplier = adjustmentDirection === "increase" ? 1 : -1;

		if (adjustmentType === "percentage") {
			const diff = Math.round(current * (adjustmentValue / 100));
			return Math.max(10, current + multiplier * diff);
		} else {
			return Math.max(10, current + multiplier * adjustmentValue);
		}
	};

	// Trigger preview mode
	const handleApplyPreview = () => {
		setIsPreviewActive(true);
		setSuccessBanner(null);
		// If no items individually selected, target all matching items
		if (selectedIds.length === 0) {
			setSelectedIds(filteredIds);
		}
	};

	// Reset preview
	const handleCancelPreview = () => {
		setIsPreviewActive(false);
	};

	// Save and commit updated prices
	const handleSavePrices = () => {
		setIsSaving(true);
		const targetIds = selectedIds.length > 0 ? selectedIds : filteredIds;

		setTimeout(() => {
			setProducts((prev) =>
				prev.map((p) => {
					if (!targetIds.includes(p.id)) return p;
					const newRetail =
						targetPriceField === "wholesale" ? p.price : calculateNewPrice(p.price);
					return {
						...p,
						price: newRetail,
						updatedAt: "Just now",
					};
				})
			);

			const adjLabel = `${adjustmentDirection === "increase" ? "+" : "-"}${adjustmentValue}${
				adjustmentType === "percentage" ? "%" : " Rs."
			}`;

			setSuccessBanner({
				count: targetIds.length,
				adjustmentText: adjLabel,
			});
			setIsSaving(false);
			setIsPreviewActive(false);
		}, 1200);
	};

	// Pagination slicing
	const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
	const paginatedProducts = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredProducts, currentPage]);

	// Total stock value impact calculation
	const impactSummary = useMemo(() => {
		const targetProducts =
			selectedIds.length > 0
				? filteredProducts.filter((p) => selectedIds.includes(p.id))
				: filteredProducts;

		const currentSum = targetProducts.reduce((sum, p) => sum + p.price, 0);
		const avgPrice = targetProducts.length ? Math.round(currentSum / targetProducts.length) : 0;

		const newSum = targetProducts.reduce((sum, p) => sum + calculateNewPrice(p.price), 0);
		const newAvgPrice = targetProducts.length ? Math.round(newSum / targetProducts.length) : 0;
		const diffSum = newSum - currentSum;

		return {
			count: targetProducts.length,
			avgPrice,
			newAvgPrice,
			diffSum,
		};
	}, [filteredProducts, selectedIds, isPreviewActive, adjustmentDirection, adjustmentType, adjustmentValue]);

	return (
		<div className="flex flex-col gap-6 w-full max-w-full min-w-0 pb-16">
			{/* Top Header & Breadcrumb */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
							<BadgeDollarSign className="size-6 text-primary" />
							Bulk Price Updater
						</h1>
						<Badge variant="outline" className="text-xs font-normal">
							Pricing Engine
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Filter parts by price bracket, brand, and vehicle model to execute bulk percentage or fixed price adjustments.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="text-xs gap-1.5"
						render={<Link href="/dashboard/products" />}
						nativeButton={false}
					>
						<ArrowLeft className="size-3.5" />
						All Products
					</Button>
				</div>
			</div>

			{/* Success Notification Banner */}
			{successBanner && (
				<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
					<div className="flex items-center gap-3">
						<div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
							<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<div>
							<h4 className="font-semibold text-sm">Bulk Prices Updated Successfully!</h4>
							<p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
								Applied <strong>{successBanner.adjustmentText}</strong> across {successBanner.count} selected spare parts. All branches have been synchronized.
							</p>
						</div>
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setSuccessBanner(null)}
						className="text-xs border-emerald-500/30 bg-background"
					>
						Dismiss
					</Button>
				</div>
			)}

			{/* 1. FILTER SECTION */}
			<div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
				<div className="flex items-center justify-between border-b pb-3">
					<div className="flex items-center gap-2">
						<div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
							<Filter className="size-4" />
						</div>
						<div>
							<h2 className="text-sm font-semibold text-foreground">Filter Products for Price Adjustment</h2>
							<p className="text-[11px] text-muted-foreground">Select price range (e.g. 100 to 500), category, brand, and bike model</p>
						</div>
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={handleResetFilters}
						className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5"
					>
						<RotateCcw className="size-3" />
						Reset Filters
					</Button>
				</div>

				{/* Filter Inputs Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
					{/* Min Price */}
					<div className="space-y-1">
						<label className="text-[11px] font-medium text-muted-foreground">Min Price (Rs.)</label>
						<div className="relative">
							<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rs.</span>
							<Input
								type="number"
								placeholder="e.g. 100"
								value={minPrice}
								onChange={(e) => {
									setMinPrice(e.target.value);
									setCurrentPage(1);
								}}
								className="pl-8 h-8 text-xs font-mono"
							/>
						</div>
					</div>

					{/* Max Price */}
					<div className="space-y-1">
						<label className="text-[11px] font-medium text-muted-foreground">Max Price (Rs.)</label>
						<div className="relative">
							<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rs.</span>
							<Input
								type="number"
								placeholder="e.g. 500"
								value={maxPrice}
								onChange={(e) => {
									setMaxPrice(e.target.value);
									setCurrentPage(1);
								}}
								className="pl-8 h-8 text-xs font-mono"
							/>
						</div>
					</div>

					{/* Category */}
					<div className="space-y-1">
						<label className="text-[11px] font-medium text-muted-foreground">Category</label>
						<Select
							value={selectedCategory}
							onValueChange={(val) => {
								if (val) {
									setSelectedCategory(val);
									setCurrentPage(1);
								}
							}}
						>
							<SelectTrigger className="h-8 text-xs w-full">
								<SelectValue placeholder="All Categories" />
							</SelectTrigger>
							<SelectContent>
								{CATEGORIES.map((cat) => (
									<SelectItem key={cat} value={cat} className="text-xs">
										{cat === "all" ? "All Categories" : cat}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Brand */}
					<div className="space-y-1">
						<label className="text-[11px] font-medium text-muted-foreground">Brand</label>
						<Select
							value={selectedBrand}
							onValueChange={(val) => {
								if (val) {
									setSelectedBrand(val);
									setCurrentPage(1);
								}
							}}
						>
							<SelectTrigger className="h-8 text-xs w-full">
								<SelectValue placeholder="All Brands" />
							</SelectTrigger>
							<SelectContent>
								{BRANDS.map((b) => (
									<SelectItem key={b} value={b} className="text-xs">
										{b === "all" ? "All Brands" : b}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Bike Model */}
					<div className="space-y-1">
						<label className="text-[11px] font-medium text-muted-foreground">Bike Model</label>
						<Select
							value={selectedModel}
							onValueChange={(val) => {
								if (val) {
									setSelectedModel(val);
									setCurrentPage(1);
								}
							}}
						>
							<SelectTrigger className="h-8 text-xs w-full">
								<SelectValue placeholder="All Models" />
							</SelectTrigger>
							<SelectContent>
								{BIKE_MODELS.map((m) => (
									<SelectItem key={m} value={m} className="text-xs">
										{m === "all" ? "All Models" : m}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Listing Type (Wholesale / Retail / Both) */}
					<div className="space-y-1">
						<label className="text-[11px] font-medium text-muted-foreground">Listing Type</label>
						<Select
							value={selectedType}
							onValueChange={(val) => {
								if (val) {
									setSelectedType(val);
									setCurrentPage(1);
								}
							}}
						>
							<SelectTrigger className="h-8 text-xs w-full">
								<SelectValue placeholder="All Types" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all" className="text-xs">All Types</SelectItem>
								<SelectItem value="Wholesale" className="text-xs">Wholesale Only</SelectItem>
								<SelectItem value="Retail" className="text-xs">Retail Only</SelectItem>
								<SelectItem value="Both" className="text-xs">Both (Universal)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Search bar inside filter block */}
				<div className="relative pt-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
					<Input
						placeholder="Search spare part name, SKU code (e.g. CRN-CD70)..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="pl-9 h-8 text-xs"
					/>
				</div>
			</div>

			{/* 2. BULK PRICE ADJUSTMENT CONTROL BAR (Top Controls) */}
			<div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-xs space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div className="flex items-center gap-2.5">
						<div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
							<SlidersHorizontal className="size-4" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-foreground">Bulk Price Adjustment Tool</h3>
							<p className="text-xs text-muted-foreground">
								Targeting <strong>{filteredProducts.length}</strong> matching spare parts currently displayed
							</p>
						</div>
					</div>

					{/* Quick Metric Pills */}
					<div className="flex flex-wrap items-center gap-2 text-xs">
						<div className="px-3 py-1 rounded-lg border bg-background flex items-center gap-1.5">
							<span className="text-muted-foreground">Matching:</span>
							<strong className="font-mono text-foreground">{filteredProducts.length} items</strong>
						</div>
						<div className="px-3 py-1 rounded-lg border bg-background flex items-center gap-1.5">
							<span className="text-muted-foreground">Avg Price:</span>
							<strong className="font-mono text-foreground">Rs. {impactSummary.avgPrice}</strong>
						</div>
						{isPreviewActive && (
							<div className="px-3 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
								<span>New Avg:</span>
								<strong className="font-mono">Rs. {impactSummary.newAvgPrice}</strong>
								<span className="text-[10px]">
									({impactSummary.diffSum >= 0 ? "+" : ""}Rs. {impactSummary.diffSum.toLocaleString()})
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Adjustment Inputs Row */}
				<div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 items-end">
					{/* Increase vs Decrease Selector */}
					<div className="md:col-span-3 space-y-1.5">
						<label className="text-[11px] font-medium text-foreground">Direction</label>
						<div className="grid grid-cols-2 gap-1.5 p-1 bg-muted rounded-lg border">
							<button
								type="button"
								onClick={() => setAdjustmentDirection("increase")}
								className={`cursor-pointer py-1 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
									adjustmentDirection === "increase"
										? "bg-emerald-600 text-white shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<ArrowUpRight className="size-3.5" /> Increase (+)
							</button>
							<button
								type="button"
								onClick={() => setAdjustmentDirection("decrease")}
								className={`cursor-pointer py-1 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
									adjustmentDirection === "decrease"
										? "bg-rose-600 text-white shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<ArrowDownRight className="size-3.5" /> Decrease (-)
							</button>
						</div>
					</div>

					{/* Percentage vs Fixed Selector */}
					<div className="md:col-span-3 space-y-1.5">
						<label className="text-[11px] font-medium text-foreground">Adjustment Type</label>
						<div className="grid grid-cols-2 gap-1.5 p-1 bg-muted rounded-lg border">
							<button
								type="button"
								onClick={() => setAdjustmentType("percentage")}
								className={`cursor-pointer py-1 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
									adjustmentType === "percentage"
										? "bg-background text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<Percent className="size-3.5" /> Percentage (%)
							</button>
							<button
								type="button"
								onClick={() => setAdjustmentType("fixed")}
								className={`cursor-pointer py-1 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
									adjustmentType === "fixed"
										? "bg-background text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<span className="font-mono text-xs">Rs.</span> Fixed Amount
							</button>
						</div>
					</div>

					{/* Adjustment Value Input */}
					<div className="md:col-span-2 space-y-1.5">
						<label className="text-[11px] font-medium text-foreground">
							{adjustmentType === "percentage" ? "Percentage Value" : "Amount (Rs.)"}
						</label>
						<div className="relative">
							<Input
								type="number"
								min="1"
								value={adjustmentValue || ""}
								onChange={(e) => setAdjustmentValue(Math.max(1, Number(e.target.value)))}
								className="h-8 font-mono text-xs font-bold pr-8 bg-background"
							/>
							<span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold pointer-events-none">
								{adjustmentType === "percentage" ? "%" : "Rs."}
							</span>
						</div>
					</div>

					{/* Action Buttons: Preview Changes & Save */}
					<div className="md:col-span-4 flex items-center gap-2 pt-1 md:pt-0">
						{!isPreviewActive ? (
							<Button
								type="button"
								onClick={handleApplyPreview}
								className="flex-1 h-8 text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
							>
								<Eye className="size-3.5" /> Preview Price Changes
							</Button>
						) : (
							<>
								<Button
									type="button"
									variant="outline"
									onClick={handleCancelPreview}
									className="h-8 text-xs cursor-pointer"
								>
									Reset Preview
								</Button>
								<Button
									type="button"
									disabled={isSaving}
									onClick={handleSavePrices}
									className="flex-1 h-8 text-xs font-semibold gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
								>
									{isSaving ? (
										<>
											<Spinner className="size-3.5 animate-spin" />
											<span>Saving...</span>
										</>
									) : (
										<>
											<Check className="size-3.5 stroke-[3]" />
											<span>Save & Apply ({selectedIds.length || filteredProducts.length})</span>
										</>
									)}
								</Button>
							</>
						)}
					</div>
				</div>
			</div>

			{/* 3. CONDITIONAL RESULTS TABLE (Shown only after clicking Preview) */}
			{!isPreviewActive ? (
				<div className="rounded-xl border border-dashed bg-card/60 p-10 text-center flex flex-col items-center justify-center gap-3 animate-in fade-in-50 duration-300">
					<div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs">
						<Eye className="size-5" />
					</div>
					<div className="max-w-md space-y-1">
						<h3 className="font-heading text-base font-semibold text-foreground">
							Price Comparison Table Hidden
						</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							{filteredProducts.length > 0 ? (
								<>
									<strong>{filteredProducts.length}</strong> products currently match your filter criteria. Click <strong>"Preview Price Changes"</strong> above or below to reveal the comparison table with new rates.
								</>
							) : (
								<>
									No products match your current price or category filters. Adjust the range above and try again.
								</>
							)}
						</p>
					</div>

					{filteredProducts.length > 0 && (
						<Button
							type="button"
							onClick={handleApplyPreview}
							className="mt-1 h-8 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
						>
							<Eye className="size-3.5" />
							Preview Price Changes ({filteredProducts.length} Items)
						</Button>
					)}
				</div>
			) : (
				<div className="rounded-xl border bg-card shadow-xs overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
					{/* Table Actions Header */}
					<div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
						<div className="flex items-center gap-2">
							<span className="font-semibold text-foreground">
								Filtered Products List ({filteredProducts.length} items)
							</span>
							{selectedIds.length > 0 && (
								<Badge variant="secondary" className="text-[11px] font-mono">
									{selectedIds.length} Selected
								</Badge>
							)}
							<Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px]">
								Preview Mode Active
							</Badge>
						</div>

						<div className="text-muted-foreground text-[11px]">
							Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
							{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} spare parts
						</div>
					</div>

					<div className="overflow-x-auto">
						<Table className="min-w-[950px]">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="w-10 px-3 text-center">
										<Checkbox
											checked={allSelected}
											indeterminate={someSelected}
											onCheckedChange={handleToggleSelectAll}
											aria-label="Select all products"
										/>
									</TableHead>
									<TableHead className="text-xs uppercase font-semibold text-foreground min-w-[220px]">
										Product Name & SKU
									</TableHead>
									<TableHead className="text-xs uppercase font-semibold text-foreground min-w-[130px]">
										Category
									</TableHead>
									<TableHead className="text-center text-xs uppercase font-semibold text-foreground w-[90px]">
										Type
									</TableHead>
									<TableHead className="text-xs uppercase font-semibold text-foreground min-w-[120px]">
										Bike Model
									</TableHead>
									<TableHead className="text-right text-xs uppercase font-semibold text-foreground w-[120px]">
										Current Price
									</TableHead>
									<TableHead className="text-right text-xs uppercase font-semibold text-foreground w-[160px] bg-primary/5">
										Updated Price
									</TableHead>
									<TableHead className="text-center text-xs uppercase font-semibold text-foreground w-[100px]">
										Stock
									</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{paginatedProducts.length > 0 ? (
									paginatedProducts.map((p) => {
										const isSelected = selectedIds.includes(p.id);
										const newPrice = calculateNewPrice(p.price);
										const priceDiff = newPrice - p.price;

										return (
											<TableRow
												key={p.id}
												className={`transition-colors ${
													isSelected ? "bg-primary/5 dark:bg-primary/10" : ""
												}`}
											>
												<TableCell className="px-3 text-center">
													<Checkbox
														checked={isSelected}
														onCheckedChange={() => handleToggleSelectOne(p.id)}
														aria-label={`Select ${p.name}`}
													/>
												</TableCell>

												<TableCell className="py-3">
													<div className="flex flex-col gap-0.5">
														<span className="font-semibold text-foreground text-xs leading-tight">
															{p.name}
														</span>
														<span className="font-mono text-[10px] text-muted-foreground">
															{p.sku}
														</span>
													</div>
												</TableCell>

												<TableCell className="text-xs text-muted-foreground">
													{p.category}
												</TableCell>

												<TableCell className="text-center">
													<Badge
														variant="outline"
														className={`text-[10px] rounded-full font-medium ${
															p.type === "Wholesale"
																? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
																: p.type === "Retail"
																? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400"
																: "bg-muted text-muted-foreground"
														}`}
													>
														{p.type}
													</Badge>
												</TableCell>

												<TableCell className="text-xs font-medium text-foreground">
													{p.bikeModel}
												</TableCell>

												<TableCell className="text-right font-mono text-xs font-semibold text-foreground">
													Rs. {p.price.toLocaleString()}
												</TableCell>

												{/* Updated Price Column */}
												<TableCell className="text-right bg-primary/5">
													<div className="flex flex-col items-end gap-0.5">
														<span className="font-mono text-sm font-bold text-foreground">
															Rs. {newPrice.toLocaleString()}
														</span>
														<span
															className={`text-[10px] font-mono font-semibold flex items-center gap-0.5 ${
																priceDiff > 0
																	? "text-emerald-600 dark:text-emerald-400"
																	: priceDiff < 0
																	? "text-rose-600 dark:text-rose-400"
																	: "text-muted-foreground"
															}`}
														>
															{priceDiff > 0 ? (
																<ArrowUpRight className="size-3" />
															) : priceDiff < 0 ? (
																<ArrowDownRight className="size-3" />
															) : null}
															{priceDiff >= 0 ? "+" : ""}
															Rs. {priceDiff} ({Math.round((priceDiff / p.price) * 100)}%)
														</span>
													</div>
												</TableCell>

												<TableCell className="text-center">
													<span className="font-mono text-xs text-muted-foreground">
														{p.totalStock} {p.unit}
													</span>
												</TableCell>
											</TableRow>
										);
									})
								) : (
									<TableRow>
										<TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
											No products match the selected price range or filter criteria.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					{/* Pagination Controls (12 per page) */}
					{totalPages > 1 && (
						<div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
							<span className="text-xs text-muted-foreground">
								Page {currentPage} of {totalPages}
							</span>
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											href="#"
											onClick={(e) => {
												e.preventDefault();
												setCurrentPage((p) => Math.max(1, p - 1));
											}}
											className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
										/>
									</PaginationItem>
									{Array.from({ length: totalPages }).map((_, idx) => (
										<PaginationItem key={idx}>
											<PaginationLink
												href="#"
												onClick={(e) => {
													e.preventDefault();
													setCurrentPage(idx + 1);
												}}
												isActive={currentPage === idx + 1}
												className="cursor-pointer text-xs"
											>
												{idx + 1}
											</PaginationLink>
										</PaginationItem>
									))}
									<PaginationItem>
										<PaginationNext
											href="#"
											onClick={(e) => {
												e.preventDefault();
												setCurrentPage((p) => Math.min(totalPages, p + 1));
											}}
											className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
