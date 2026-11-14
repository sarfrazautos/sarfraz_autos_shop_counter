"use client";

import { useState, useMemo } from "react";
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
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	INITIAL_TRADE_SCHEMES,
	type TradeScheme,
	type SchemeType,
} from "./types";
import { INITIAL_PRODUCTS, type ProductItem } from "@/components/Products/types";
import Link from "next/link";

export function TradeSchemesView() {
	const [schemes, setSchemes] = useState<TradeScheme[]>(INITIAL_TRADE_SCHEMES);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedType, setSelectedType] = useState<string>("All");
	const [selectedStatus, setSelectedStatus] = useState<string>("All");

	// Dialog state for adding/editing a scheme
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [selectedProductId, setSelectedProductId] = useState<string>(
		INITIAL_PRODUCTS[0]?.id || "PRD-101"
	);
	const [schemeType, setSchemeType] = useState<SchemeType>("buy_x_get_y");
	const [buyQuantity, setBuyQuantity] = useState<number>(20);
	const [freeQuantity, setFreeQuantity] = useState<number>(1);
	const [netSchemeRate, setNetSchemeRate] = useState<number>(1280);
	const [applicableTier, setApplicableTier] = useState<
		"Wholesale Only" | "All Customers" | "Registered Dealers"
	>("Wholesale Only");
	const [validFrom, setValidFrom] = useState("01 Nov 2026");
	const [validTo, setValidTo] = useState("30 Nov 2026");
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
			INITIAL_PRODUCTS.find((p) => p.id === selectedProductId) ||
			INITIAL_PRODUCTS[0]
		);
	}, [selectedProductId]);

	// Auto calculate savings % for dialog preview
	const previewSavings = useMemo(() => {
		if (schemeType === "buy_x_get_y") {
			// e.g. 20 bought, 1 free -> total 21 items for price of 20 -> savings is 1/21 ~ 4.76%
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

	// Filtered Schemes
	const filteredSchemes = useMemo(() => {
		return schemes.filter((s) => {
			const matchesSearch =
				!searchQuery.trim() ||
				s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.bikeModel.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesType =
				selectedType === "All" || s.schemeType === selectedType;

			const matchesStatus =
				selectedStatus === "All" || s.status === selectedStatus;

			return matchesSearch && matchesType && matchesStatus;
		});
	}, [schemes, searchQuery, selectedType, selectedStatus]);

	// Metric KPI Calculations
	const totalActive = useMemo(() => {
		return schemes.filter((s) => s.status === "Active").length;
	}, [schemes]);

	const totalBonusGiven = useMemo(() => {
		return schemes.reduce((sum, s) => sum + s.totalDispatchedBonus, 0);
	}, [schemes]);

	// Toggle scheme active/pause
	const handleToggleStatus = (schemeId: string) => {
		setSchemes((prev) =>
			prev.map((s) => {
				if (s.id === schemeId) {
					const nextStatus = s.status === "Active" ? "Paused" : "Active";
					return { ...s, status: nextStatus };
				}
				return s;
			})
		);
		showNotice("Trade scheme status updated");
	};

	// Delete scheme
	const handleDeleteScheme = (schemeId: string) => {
		if (confirm("Remove this trade scheme from the active counter catalog?")) {
			setSchemes((prev) => prev.filter((s) => s.id !== schemeId));
			showNotice("Scheme deleted");
		}
	};

	// Create new scheme handler
	const handleSaveScheme = () => {
		if (!activeProduct) return;

		const schemeTitle =
			schemeType === "buy_x_get_y"
				? `Buy ${buyQuantity} ${activeProduct.name} — Get ${freeQuantity} Free`
				: `Wholesale Scheme Rate (Rs. ${netSchemeRate}) for ${activeProduct.name}`;

		const newScheme: TradeScheme = {
			id: `SCH-${Math.floor(100 + Math.random() * 900)}`,
			title: schemeTitle,
			productId: activeProduct.id,
			productName: activeProduct.name,
			sku: activeProduct.sku,
			bikeModel: activeProduct.bikeModel,
			category: activeProduct.category,
			regularPrice: activeProduct.price,
			schemeType: schemeType,
			buyQuantity: buyQuantity,
			freeQuantity: schemeType === "buy_x_get_y" ? freeQuantity : 0,
			freeItemName:
				schemeType === "buy_x_get_y"
					? `${activeProduct.name} (${freeQuantity}x Free Bonus)`
					: undefined,
			netSchemeRate:
				schemeType === "net_rate"
					? netSchemeRate
					: Math.round(
							activeProduct.price * (1 - previewSavings / 100)
					  ),
			effectiveSavingsPercent: previewSavings,
			applicableTier: applicableTier,
			validFrom: validFrom,
			validTo: validTo,
			status: "Active",
			totalDispatchedBonus: 0,
			remarks: schemeRemarks.trim()
				? schemeRemarks
				: `Configured for ${applicableTier}`,
		};

		setSchemes([newScheme, ...schemes]);
		setIsAddOpen(false);
		setSchemeRemarks("");
		showNotice(`Created scheme "${newScheme.title}" successfully!`);
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
							<h1 className="font-heading font-black text-lg sm:text-xl text-foreground">
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

			{/* 4 SUMMARY METRIC CARDS */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Active Schemes */}
				<div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
						Active Trade Schemes
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl sm:text-3xl font-mono font-black text-foreground">
							{totalActive} Active
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
							{schemes.length} Parts
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

				{/* Effective Dealer Benefit */}
				<div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-4 shadow-xs space-y-1">
					<span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
						Wholesale Margin Benefit
					</span>
					<div className="flex items-baseline justify-between">
						<span className="text-2xl sm:text-3xl font-mono font-black text-foreground">
							5% – 13.5%
						</span>
						<TrendingUp className="size-4 text-amber-600" />
					</div>
					<p className="text-[11px] text-muted-foreground">Average margin discount for wholesale buyers</p>
				</div>
			</div>

			{/* FILTERS & SEARCH TOOLBAR */}
			<div className="rounded-2xl border bg-card p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
					{/* Scheme Type Filter */}
					<div className="w-56">
						<Select
							value={selectedType}
							onValueChange={(val) => {
								if (val) setSelectedType(val);
							}}
						>
							<SelectTrigger className="h-8 text-xs font-semibold bg-background">
								<SelectValue placeholder="Scheme Type..." />
							</SelectTrigger>
							<SelectContent>
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
					<div className="w-44">
						<Select
							value={selectedStatus}
							onValueChange={(val) => {
								if (val) setSelectedStatus(val);
							}}
						>
							<SelectTrigger className="h-8 text-xs font-semibold bg-background">
								<SelectValue placeholder="Status..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="All" className="text-xs">
									All Statuses
								</SelectItem>
								<SelectItem value="Active" className="text-xs">
									Active Only
								</SelectItem>
								<SelectItem value="Paused" className="text-xs">
									Paused Only
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Search box */}
				<div className="relative w-full sm:w-72">
					<Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search product, SKU, model..."
						className="h-8 text-xs pl-8 bg-background"
					/>
				</div>
			</div>

			{/* SCHEMES GRID / CARDS */}
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
									onClick={() => handleDeleteScheme(scheme.id)}
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
						{/* Product Picker */}
						<div className="space-y-1">
							<label className="font-semibold text-muted-foreground">
								Select Target Spare Part:
							</label>
							<Select
								value={selectedProductId}
								onValueChange={(val) => {
									if (val) {
										setSelectedProductId(val);
										const prod = INITIAL_PRODUCTS.find((p) => p.id === val);
										if (prod) {
											setNetSchemeRate(Math.round(prod.price * 0.88));
										}
									}
								}}
							>
								<SelectTrigger className="h-9 text-xs w-full font-bold">
									<SelectValue placeholder="Choose product..." />
								</SelectTrigger>
								<SelectContent>
									{INITIAL_PRODUCTS.map((p) => (
										<SelectItem key={p.id} value={p.id} className="text-xs">
											<div className="flex items-center justify-between w-full gap-4">
												<span className="font-semibold">{p.name}</span>
												<span className="text-[10px] font-mono text-muted-foreground">
													Reg: Rs. {p.price.toLocaleString()} ({p.bikeModel})
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
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
						<div className="space-y-1">
							<label className="font-semibold text-muted-foreground">
								Target Buyer Eligibility:
							</label>
							<Select
								value={applicableTier}
								onValueChange={(val) => {
									if (val) setApplicableTier(val as any);
								}}
							>
								<SelectTrigger className="h-8 text-xs font-semibold">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
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
		</div>
	);
}
