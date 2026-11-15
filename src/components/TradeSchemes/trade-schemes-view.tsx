"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
	fetchTradeSchemes,
	createTradeScheme,
	updateTradeScheme,
	deleteTradeScheme,
} from "@/lib/api/trade-schemes/trade-schemes-api";
import { fetchProducts } from "@/lib/api/products/products-api";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

function getPaginationItems(currentPage: number, totalPages: number): (number | "ellipsis")[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}
	if (currentPage <= 4) {
		return [1, 2, 3, 4, 5, "ellipsis", totalPages];
	}
	if (currentPage >= totalPages - 3) {
		return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
	}
	return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}
import {
	BadgePercent,
	Search,
	Plus,
	Gift,
	Percent,
	Sparkles,
	Layers,
	Bike,
	Calendar,
	CheckCircle2,
	AlertCircle,
	PauseCircle,
	PlayCircle,
	Trash2,
	Edit3,
	Tag,
	ArrowRight,
	Info,
	TrendingUp,
	ShoppingCart,
	AlertTriangle,
	Loader2,
} from "lucide-react";
import { ProductSearchSelect } from "./product-search-select";
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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	INITIAL_TRADE_SCHEMES,
	type TradeScheme,
	type SchemeType,
} from "./types";
import { INITIAL_PRODUCTS, type ProductItem } from "@/components/Products/types";
import { TradeSchemesCardsSkeleton } from "@/components/Skeletons/trade-schemes-skeleton";
import Link from "next/link";

export function TradeSchemesView() {
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedType, setSelectedType] = useState<string>("All");
	const [selectedStatus, setSelectedStatus] = useState<string>("All");
	const [currentPage, setCurrentPage] = useState(1);

	// TanStack Query for 12-item paginated trade schemes
	const { data: schemesData, isLoading: isSchemesLoading } = useQuery({
		queryKey: queryKeys.tradeSchemes.list({
			page: currentPage,
			search: searchQuery,
			status: selectedStatus,
			type: selectedType,
		}),
		queryFn: () =>
			fetchTradeSchemes({
				page: currentPage,
				search: searchQuery,
				status: selectedStatus,
				type: selectedType,
			}),
		staleTime: 1000 * 60 * 5,
	});

	// Fetch products for dialog
	const { data: productsData } = useQuery({
		queryKey: queryKeys.products.list({ page: 1 }),
		queryFn: () => fetchProducts({ page: 1 }),
		staleTime: 1000 * 60 * 5,
	});

	const availableProducts = productsData?.data || [];

	// Mutations
	const createMutation = useMutation({
		mutationFn: (payload: any) => createTradeScheme(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.tradeSchemes.all });
			showNotice("Created trade promotional scheme successfully!");
			setIsAddOpen(false);
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: any }) => updateTradeScheme(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.tradeSchemes.all });
			showNotice("Trade scheme updated successfully!");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteTradeScheme(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.tradeSchemes.all });
			showNotice("Scheme deleted successfully");
		},
	});

	// Dialog state for adding/editing a scheme
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [selectedProductId, setSelectedProductId] = useState<string>(
		availableProducts[0]?.id || "PRD-101"
	);
	const [schemeType, setSchemeType] = useState<SchemeType>("buy_x_get_y");
	const [buyQuantity, setBuyQuantity] = useState<number>(20);
	const [freeQuantity, setFreeQuantity] = useState<number>(1);
	const [netSchemeRate, setNetSchemeRate] = useState<number>(1280);
	const [applicableTier, setApplicableTier] = useState<
		"Wholesale Only" | "All Customers" | "Registered Dealers"
	>("Wholesale Only");
	const [validFrom, setValidFrom] = useState("2026-11-01");
	const [validTo, setValidTo] = useState("2026-11-30");
	const [schemeRemarks, setSchemeRemarks] = useState("");

	// Flash notification
	const [notice, setNotice] = useState<string | null>(null);
	const showNotice = (msg: string) => {
		setNotice(msg);
		setTimeout(() => setNotice(null), 3500);
	};

	// Active product selected in dialog
	const activeProduct = useMemo(() => {
		return (
			availableProducts.find((p) => p.id === selectedProductId) ||
			availableProducts[0]
		);
	}, [availableProducts, selectedProductId]);

	// Auto calculate savings % for dialog preview
	const previewSavings = useMemo(() => {
		if (schemeType === "buy_x_get_y") {
			const totalUnits = buyQuantity + freeQuantity;
			if (totalUnits <= 0) return 0;
			return Number(((freeQuantity / totalUnits) * 100).toFixed(1));
		} else if (schemeType === "net_rate") {
			if (!activeProduct?.price || activeProduct.price <= 0) return 0;
			const saving = activeProduct.price - netSchemeRate;
			return Number(((saving / activeProduct.price) * 100).toFixed(1));
		} else {
			return 10.0;
		}
	}, [schemeType, buyQuantity, freeQuantity, netSchemeRate, activeProduct]);

	// Schemes list
	const schemesList: TradeScheme[] = (schemesData?.data || []).map((s) => ({
		id: s.id,
		title: s.title,
		productId: s.productId,
		productName: s.productName,
		sku: s.productSku,
		bikeModel: s.bikeModel,
		category: s.category,
		regularPrice: s.regularWholesalePrice,
		schemeType: s.type,
		buyQuantity: s.buyQuantity,
		freeQuantity: s.freeQuantity,
		freeItemName: s.freeQuantity ? `${s.productName} (${s.freeQuantity}x Free)` : undefined,
		netSchemeRate: s.netSchemeRate || s.regularWholesalePrice,
		effectiveSavingsPercent: s.type === "buy_x_get_y" 
			? Number(((s.freeQuantity / (s.buyQuantity + s.freeQuantity)) * 100).toFixed(1))
			: s.netSchemeRate ? Number((((s.regularWholesalePrice - s.netSchemeRate) / s.regularWholesalePrice) * 100).toFixed(1)) : 0,
		applicableTier: s.applicableTier as any,
		validFrom: s.validFrom,
		validTo: s.validTo,
		status: s.status,
		totalDispatchedBonus: 12,
		remarks: s.remarks,
	}));

	const filteredSchemes = schemesList;
	const totalPages = schemesData?.pagination?.totalPages || 1;
	const totalCount = schemesData?.pagination?.totalCount || 0;

	// Active scheme map for warning badge & banner
	const activeSchemeProductMap = useMemo(() => {
		const map = new Map<string, TradeScheme>();
		for (const s of schemesList) {
			if (s.status === "Active") {
				map.set(s.productId, s);
			}
		}
		return map;
	}, [schemesList]);

	const activeSchemeProductIds = useMemo(() => {
		return new Set(activeSchemeProductMap.keys());
	}, [activeSchemeProductMap]);

	const activeSchemeForSelected = activeSchemeProductMap.get(selectedProductId);

	// Metric KPI Calculations
	const totalActive = useMemo(() => {
		return filteredSchemes.filter((s) => s.status === "Active").length;
	}, [filteredSchemes]);

	const totalBonusGiven = useMemo(() => {
		return filteredSchemes.reduce((sum, s) => sum + s.totalDispatchedBonus, 0);
	}, [filteredSchemes]);

	// Toggle scheme active/pause
	const handleToggleStatus = (schemeId: string) => {
		const target = filteredSchemes.find((s) => s.id === schemeId);
		if (!target) return;
		const nextStatus = target.status === "Active" ? "Paused" : "Active";
		updateMutation.mutate({ id: schemeId, payload: { status: nextStatus } });
	};

	// Delete scheme
	const [schemeToDelete, setSchemeToDelete] = useState<TradeScheme | null>(null);

	const handleDeleteScheme = (scheme: TradeScheme) => {
		setSchemeToDelete(scheme);
	};

	const handleConfirmDelete = () => {
		if (schemeToDelete) {
			deleteMutation.mutate(schemeToDelete.id);
			setSchemeToDelete(null);
		}
	};

	// Create new scheme handler
	const handleSaveScheme = () => {
		if (!activeProduct) return;

		const schemeTitle =
			schemeType === "buy_x_get_y"
				? `Buy ${buyQuantity} ${activeProduct.name} — Get ${freeQuantity} Free`
				: `Wholesale Scheme Rate (Rs. ${netSchemeRate}) for ${activeProduct.name}`;

		createMutation.mutate({
			productId: activeProduct.id,
			title: schemeTitle,
			type: schemeType,
			buyQuantity,
			freeQuantity,
			netSchemeRate: schemeType === "net_rate" ? netSchemeRate : null,
			applicableTier,
			validFrom: validFrom.includes("-") ? validFrom : "2026-11-01",
			validTo: validTo.includes("-") ? validTo : "2026-11-30",
			status: "Active",
			remarks: schemeRemarks.trim() || `Configured for ${applicableTier}`,
		});
	};

	return (
		<div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-16">
			{/* NOTICE FLASH */}
			{notice && (
				<div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
					<CheckCircle2 className="size-4 text-emerald-600" />
					<span>{notice}</span>
				</div>
			)}

			{/* HEADER & CREATE BAR */}
			<div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
						<BadgePercent className="size-6" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
								Trade Schemes & Bonus Rules
							</h1>
							<Badge
								variant="outline"
								className="text-[10px] py-0 px-2 font-mono bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
							>
								Wholesale Promos
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5">
							Configure "Buy 20 Get 1 Free", wholesale net scheme rates, and bonus carton allowances for counter POS.
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2.5">
					<Button
						size="sm"
						onClick={() => setIsAddOpen(true)}
						className="h-9 px-3.5 gap-1.5 bg-primary text-primary-foreground font-bold text-xs cursor-pointer shadow-xs active:scale-98 transition-all"
					>
						<Plus className="size-3.5" />
						Create New Scheme
					</Button>

					<Button
						variant="outline"
						size="sm"
						className="h-9 px-3 text-xs font-semibold"
						render={<Link href="/dashboard/counter" />}
					>
						<ShoppingCart className="size-3.5 mr-1 text-primary" />
						Open Counter
					</Button>
				</div>
			</div>

			{/* 3 SUMMARY METRIC CARDS */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{/* Active Schemes */}
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
						Active Trade Schemes
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl sm:text-3xl font-mono font-black text-foreground">
							{totalCount} Active
						</span>
						<Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30">
							Live on Counter
						</Badge>
					</div>
					<p className="text-[11px] text-muted-foreground">Running promotional auto parts schemes</p>
				</div>

				{/* Total Products Enrolled */}
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
						Products Enrolled
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl font-mono font-black text-foreground">
							{totalCount} Parts
						</span>
						<Sparkles className="size-4 text-amber-500" />
					</div>
					<p className="text-[11px] text-muted-foreground">Crown, Honda OEM & Universal items</p>
				</div>

				{/* Free Bonus Items Dispatched */}
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
						Free Bonus Units Given
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
							{totalBonusGiven} Units
						</span>
						<Gift className="size-4 text-emerald-600" />
					</div>
					<p className="text-[11px] text-muted-foreground">"Buy X Get Y Free" bonus delivered</p>
				</div>
			</div>

			{/* FILTERS & SEARCH TOOLBAR */}
			<div className="rounded-2xl border bg-card p-4 shadow-xs flex flex-wrap items-end justify-between gap-4">
				<div className="flex flex-wrap items-end gap-3 flex-1 min-w-[280px]">
					{/* Scheme Format / Type Filter */}
					<div className="space-y-1 w-full sm:w-72 lg:w-80">
						<label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
							<BadgePercent className="size-3 text-amber-600" />
							<span>Scheme Format:</span>
						</label>
						<Select
							value={selectedType}
							onValueChange={(val) => {
								if (val) setSelectedType(val);
							}}
						>
							<SelectTrigger className="w-full h-9 text-xs font-semibold bg-background justify-between">
								<SelectValue placeholder="All Scheme Formats">
									{selectedType === "All"
										? "All Scheme Formats"
										: selectedType === "buy_x_get_y"
										? "🎁 Buy X Get Y Free (Bonus)"
										: selectedType === "net_rate"
										? "🏷️ Net Scheme Rate"
										: "💰 Flat Cash Rebate"}
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="w-full min-w-[300px]">
								<SelectItem value="All" className="text-xs">
									All Scheme Formats
								</SelectItem>
								<SelectItem value="buy_x_get_y" className="text-xs">
									🎁 Buy X Get Y Free (Bonus)
								</SelectItem>
								<SelectItem value="net_rate" className="text-xs">
									🏷️ Net Scheme Rate
								</SelectItem>
								<SelectItem value="flat_discount" className="text-xs">
									💰 Flat Cash Rebate
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Status Filter */}
					<div className="space-y-1 w-full sm:w-52 lg:w-56">
						<label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
							<Tag className="size-3 text-primary" />
							<span>Status:</span>
						</label>
						<Select
							value={selectedStatus}
							onValueChange={(val) => {
								if (val) setSelectedStatus(val);
							}}
						>
							<SelectTrigger className="w-full h-9 text-xs font-semibold bg-background justify-between">
								<SelectValue placeholder="All Statuses">
									{selectedStatus === "All"
										? "All Statuses"
										: selectedStatus === "Active"
										? "🟢 Active Only"
										: "⏸️ Paused Only"}
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="w-full min-w-[220px]">
								<SelectItem value="All" className="text-xs">
									All Statuses
								</SelectItem>
								<SelectItem value="Active" className="text-xs">
									🟢 Active Only
								</SelectItem>
								<SelectItem value="Paused" className="text-xs">
									⏸️ Paused Only
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Search box */}
				<div className="space-y-1 w-full sm:w-72">
					<label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
						<Search className="size-3 text-muted-foreground" />
						<span>Search Schemes:</span>
					</label>
					<div className="relative">
						<Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search product, SKU, model..."
							className="h-9 text-xs pl-8 bg-background w-full"
						/>
					</div>
				</div>
			</div>

			{/* SCHEMES GRID / CARDS */}
			{isSchemesLoading ? (
				<TradeSchemesCardsSkeleton count={6} />
			) : filteredSchemes.length === 0 ? (
				<div className="rounded-2xl border border-dashed bg-card/60 p-12 text-center flex flex-col items-center justify-center gap-3">
					<div className="size-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-xs">
						<Tag className="size-5" />
					</div>
					<div className="max-w-md space-y-1">
						<h3 className="font-heading text-base font-semibold text-foreground">
							No Trade Schemes Found
						</h3>
						<p className="text-xs text-muted-foreground leading-relaxed">
							No promotional schemes match your current search or status filter. Try clearing your filters or create a new scheme.
						</p>
					</div>
					<Button
						size="sm"
						onClick={() => {
							setSearchQuery("");
							setSelectedType("All");
							setSelectedStatus("All");
							setCurrentPage(1);
						}}
						variant="outline"
						className="text-xs"
					>
						Reset All Filters
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredSchemes.map((scheme) => {
						const isBuyXGetY = scheme.schemeType === "buy_x_get_y";

						return (
							<div
								key={scheme.id}
								className={`rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
									scheme.status === "Paused"
										? "opacity-60 bg-muted/20"
										: "border-border"
								}`}
							>
								{/* Card Top: Header & Badges */}
								<div className="space-y-3">
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2">
											<div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
												{isBuyXGetY ? (
													<Gift className="size-4.5 text-amber-600 dark:text-amber-400" />
												) : (
													<Tag className="size-4.5 text-primary" />
												)}
											</div>
											<div>
												<Badge
													variant="outline"
													className={`text-[9px] font-mono px-1.5 py-0 ${
														isBuyXGetY
															? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
															: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300"
													}`}
												>
													{isBuyXGetY ? "Buy X Get Y Free" : "Net Scheme Rate"}
												</Badge>
												<span className="text-[10px] text-muted-foreground block font-mono">
													{scheme.sku}
												</span>
											</div>
										</div>

										<Badge
											variant={scheme.status === "Active" ? "outline" : "secondary"}
											className={`text-[10px] font-semibold ${
												scheme.status === "Active"
													? "border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
													: "text-muted-foreground"
											}`}
										>
											{scheme.status}
										</Badge>
									</div>

									{/* Product Name & Bike Model */}
									<div>
										<h3 className="font-heading font-bold text-sm text-foreground line-clamp-1">
											{scheme.productName}
										</h3>
										<span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
											<Bike className="size-3 text-primary" />
											{scheme.bikeModel} • {scheme.category}
										</span>
									</div>

									{/* SCHEME RULE HIGHLIGHT BOX */}
									<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5">
										<div className="text-xs font-bold text-amber-950 dark:text-amber-200">
											{scheme.title}
										</div>

										<div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-500/20 text-xs">
											<div>
												<span className="text-[10px] text-amber-800/80 dark:text-amber-300/80 block">
													Regular Wholesale:
												</span>
												<span className="font-mono font-bold line-through text-muted-foreground">
													Rs. {scheme.regularPrice.toLocaleString()}
												</span>
											</div>

											<div>
												<span className="text-[10px] text-amber-800/80 dark:text-amber-300/80 block font-bold">
													{isBuyXGetY ? "Min Purchase Qty:" : "Net Scheme Rate:"}
												</span>
												<span className="font-mono font-black text-amber-700 dark:text-amber-300">
													{isBuyXGetY
														? `${scheme.buyQuantity} Pcs`
														: `Rs. ${(scheme.netSchemeRate || 0).toLocaleString()}`}
												</span>
											</div>
										</div>
									</div>

									{/* Bonus & Validity Details */}
									<div className="text-xs space-y-1 text-muted-foreground pt-1">
										<div className="flex justify-between items-center text-[11px]">
											<span>Effective Savings:</span>
											<strong className="text-emerald-600 font-mono">
												~{scheme.effectiveSavingsPercent}% Margin
											</strong>
										</div>
										<div className="flex justify-between items-center text-[11px]">
											<span>Eligible Buyers:</span>
											<strong className="text-foreground">{scheme.applicableTier}</strong>
										</div>
										<div className="flex justify-between items-center text-[11px]">
											<span>Bonus Units Delivered:</span>
											<strong className="font-mono text-foreground">
												{scheme.totalDispatchedBonus} free units
											</strong>
										</div>
										<div className="flex justify-between items-center text-[11px]">
											<span>Valid Duration:</span>
											<span>{scheme.validFrom} – {scheme.validTo}</span>
										</div>
									</div>
								</div>

								{/* Card Actions Footer */}
								<div className="pt-4 border-t mt-4 flex items-center justify-between gap-2">
									<Button
										size="xs"
										variant="outline"
										onClick={() => handleToggleStatus(scheme.id)}
										className="h-7 px-2.5 text-xs font-semibold gap-1 cursor-pointer"
									>
										{scheme.status === "Active" ? (
											<>
												<PauseCircle className="size-3 text-amber-600" />
												Pause
											</>
										) : (
											<>
												<PlayCircle className="size-3 text-emerald-600" />
												Activate
											</>
										)}
									</Button>

									<Button
										size="icon-xs"
										variant="ghost"
										onClick={() => handleDeleteScheme(scheme)}
										className="size-7 text-muted-foreground hover:text-rose-600 cursor-pointer"
										title="Delete scheme"
									>
										<Trash2 className="size-3.5" />
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* 12-Item Server Smart Pagination */}
			{totalPages > 1 && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
					<p className="text-xs text-muted-foreground font-medium">
						Showing <strong className="text-foreground">{(currentPage - 1) * 12 + 1}</strong> to{" "}
						<strong className="text-foreground">{Math.min(currentPage * 12, totalCount)}</strong> of{" "}
						<strong className="text-foreground">{totalCount}</strong> schemes
					</p>

					<Pagination className="justify-center sm:justify-end w-auto mx-0">
						<PaginationContent className="gap-1">
							<PaginationItem>
								<PaginationPrevious
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (currentPage > 1) setCurrentPage((p) => p - 1);
									}}
									className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
								/>
							</PaginationItem>

							{getPaginationItems(currentPage, totalPages).map((item, idx) => {
								if (item === "ellipsis") {
									return (
										<PaginationItem key={`ellipsis-${idx}`}>
											<PaginationEllipsis />
										</PaginationItem>
									);
								}
								return (
									<PaginationItem key={item}>
										<PaginationLink
											href="#"
											isActive={item === currentPage}
											onClick={(e) => {
												e.preventDefault();
												setCurrentPage(item);
											}}
											className="cursor-pointer size-8 text-xs font-semibold"
										>
											{item}
										</PaginationLink>
									</PaginationItem>
								);
							})}

							<PaginationItem>
								<PaginationNext
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (currentPage < totalPages) setCurrentPage((p) => p + 1);
									}}
									className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}

			{/* CREATE SCHEME DIALOG MODAL */}
			<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<BadgePercent className="size-5 text-amber-600" />
							Create New Trade Scheme
						</DialogTitle>
						<DialogDescription>
							Set trade promotional rules, "Buy 20 Get 1 Free" bonus deals, or net scheme rates for motorcycle parts.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2 text-xs">
						{/* Product Picker with Search Suggestions */}
						<div className="space-y-1">
							<div className="flex items-center justify-between text-muted-foreground font-semibold">
								<span>Select Target Spare Part:</span>
								<span className="text-[10px] font-normal text-muted-foreground">Type to search 1,000+ parts</span>
							</div>
							<ProductSearchSelect
								selectedProductId={selectedProductId}
								availableProducts={availableProducts}
								activeSchemeProductIds={activeSchemeProductIds}
								onSelectProduct={(prod) => {
									setSelectedProductId(prod.id);
									setNetSchemeRate(Math.round(prod.price * 0.88));
								}}
							/>
							{activeSchemeForSelected && (
								<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start gap-2.5 text-xs">
									<Sparkles className="size-4 text-amber-600 shrink-0 mt-0.5" />
									<div className="space-y-0.5 min-w-0">
										<span className="font-bold text-amber-900 dark:text-amber-200 block">
											Scheme Already Active for This Product
										</span>
										<p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
											"{activeSchemeForSelected.title}" ({activeSchemeForSelected.schemeType === "buy_x_get_y" ? `Buy ${activeSchemeForSelected.buyQuantity} Get ${activeSchemeForSelected.freeQuantity} Free` : `Net Rs. ${activeSchemeForSelected.netSchemeRate}`}) is currently running.
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Scheme Format Selection */}
						<div className="space-y-1">
							<label className="font-semibold text-muted-foreground">
								Promotion Scheme Format:
							</label>
							<div className="grid grid-cols-2 gap-2">
								<button
									type="button"
									onClick={() => setSchemeType("buy_x_get_y")}
									className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
										schemeType === "buy_x_get_y"
											? "border-amber-500 bg-amber-500/10 font-bold text-amber-950 dark:text-amber-200"
											: "border-border hover:bg-muted/50 text-muted-foreground"
									}`}
								>
									<Gift className="size-4 text-amber-600 mb-1" />
									<div className="text-xs">Buy X Get Y Free</div>
									<div className="text-[10px] opacity-80">e.g. Buy 20, Get 1 Free</div>
								</button>

								<button
									type="button"
									onClick={() => setSchemeType("net_rate")}
									className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
										schemeType === "net_rate"
											? "border-primary bg-primary/10 font-bold text-foreground"
											: "border-border hover:bg-muted/50 text-muted-foreground"
									}`}
								>
									<Tag className="size-4 text-primary mb-1" />
									<div className="text-xs">Net Scheme Rate</div>
									<div className="text-[10px] opacity-80">e.g. Special Rs. 1,280 rate</div>
								</button>
							</div>
						</div>

						{/* Parameters: Buy Qty & Free Qty OR Net Rate */}
						{schemeType === "buy_x_get_y" ? (
							<div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border">
								<div className="space-y-1">
									<label className="text-[11px] font-semibold text-muted-foreground">
										Required Buy Quantity:
									</label>
									<Input
										type="number"
										min={1}
										value={buyQuantity}
										onChange={(e) =>
											setBuyQuantity(Math.max(1, parseInt(e.target.value) || 1))
										}
										className="h-8 font-mono font-bold text-xs"
										placeholder="e.g. 20"
									/>
									<span className="text-[10px] text-muted-foreground block">
										Dealer must purchase this qty
									</span>
								</div>

								<div className="space-y-1">
									<label className="text-[11px] font-semibold text-emerald-600">
										Free Bonus Quantity:
									</label>
									<Input
										type="number"
										min={1}
										value={freeQuantity}
										onChange={(e) =>
											setFreeQuantity(Math.max(1, parseInt(e.target.value) || 1))
										}
										className="h-8 font-mono font-bold text-xs border-emerald-500/40"
										placeholder="e.g. 1"
									/>
									<span className="text-[10px] text-emerald-600 block">
										Given at zero charge (Free)
									</span>
								</div>
							</div>
						) : (
							<div className="p-3 bg-muted/40 rounded-xl border space-y-1">
								<div className="flex justify-between items-center">
									<label className="text-[11px] font-semibold text-muted-foreground">
										Discounted Scheme Rate (PKR):
									</label>
									<span className="text-[10px] text-muted-foreground line-through">
										Regular: Rs. {activeProduct?.price.toLocaleString()}
									</span>
								</div>
								<Input
									type="number"
									min={1}
									value={netSchemeRate}
									onChange={(e) =>
										setNetSchemeRate(Math.max(1, parseInt(e.target.value) || 1))
									}
									className="h-8 font-mono font-bold text-xs"
								/>
								<span className="text-[10px] text-emerald-600 block font-medium">
									Dealer saves Rs. {(activeProduct ? activeProduct.price - netSchemeRate : 0).toLocaleString()} per unit
								</span>
							</div>
						)}

						{/* Target Buyer Group */}
						<div className="space-y-1 w-full">
							<label className="font-semibold text-muted-foreground block text-xs">
								Target Buyer Eligibility:
							</label>
							<Select
								value={applicableTier}
								onValueChange={(val) => {
									if (val) setApplicableTier(val as any);
								}}
							>
								<SelectTrigger className="w-full h-9 text-xs font-semibold bg-background">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="w-full min-w-[320px] sm:min-w-[420px]">
									<SelectItem value="Wholesale Only" className="text-xs">
										Wholesale Only (Auto Parts Shops)
									</SelectItem>
									<SelectItem value="Registered Dealers" className="text-xs">
										Verified Credit Dealers Only
									</SelectItem>
									<SelectItem value="All Customers" className="text-xs">
										All Customers (Retail & Workshop)
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Scheme Remarks */}
						<div className="space-y-1">
							<label className="font-semibold text-muted-foreground">
								Scheme Notes / Campaign Name:
							</label>
							<Input
								value={schemeRemarks}
								onChange={(e) => setSchemeRemarks(e.target.value)}
								placeholder="e.g. Official Crown Winter Promo"
								className="h-8 text-xs"
							/>
						</div>

						{/* Live Calculation Preview */}
						<div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
							<div>
								<span className="text-[10px] text-amber-900 dark:text-amber-200 uppercase font-bold block">
									Calculated Dealer Margin Benefit
								</span>
								<span className="text-[11px] text-amber-800 dark:text-amber-300">
									{schemeType === "buy_x_get_y"
										? `Buy ${buyQuantity} + Get ${freeQuantity} Free`
										: `Scheme Price Rs. ${netSchemeRate.toLocaleString()}`}
								</span>
							</div>
							<span className="font-mono font-black text-amber-800 dark:text-amber-200 text-base">
								~{previewSavings}% Off
							</span>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsAddOpen(false)}
							className="cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveScheme}
							className="bg-primary text-primary-foreground font-bold cursor-pointer"
						>
							Save & Publish Scheme
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* shadcn Delete Confirmation Dialog */}
			<AlertDialog
				open={!!schemeToDelete}
				onOpenChange={(open) => !open && setSchemeToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
							<AlertTriangle className="size-5" />
						</div>
						<AlertDialogTitle>Are you sure you want to delete this trade scheme?</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove the scheme <span className="font-semibold text-foreground">"{schemeToDelete?.title}"</span> for <span className="font-semibold text-foreground">{schemeToDelete?.productName}</span> from active counter promotions.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setSchemeToDelete(null)} className="cursor-pointer">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className="bg-red-600 hover:bg-red-700 text-white font-medium cursor-pointer"
						>
							{deleteMutation.isPending ? (
								<>
									<Loader2 className="size-3.5 animate-spin mr-1.5" />
									Deleting...
								</>
							) : (
								"Yes, Delete Scheme"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
