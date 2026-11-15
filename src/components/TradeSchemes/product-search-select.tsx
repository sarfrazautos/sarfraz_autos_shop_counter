"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Search, X, Check, ChevronsUpDown, Loader2, Sparkles, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ProductItem } from "@/components/Products/types";

interface ProductSearchSelectProps {
	selectedProductId: string;
	onSelectProduct: (product: {
		id: string;
		name: string;
		sku: string;
		price: number;
		bikeModel: string;
		category?: string;
		imageUrl?: string;
	}) => void;
	availableProducts?: ProductItem[];
	activeSchemeProductIds?: Set<string>;
}

export function ProductSearchSelect({
	selectedProductId,
	onSelectProduct,
	availableProducts = [],
	activeSchemeProductIds,
}: ProductSearchSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchingApi, setIsSearchingApi] = useState(false);
	const [apiResults, setApiResults] = useState<ProductItem[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const checkHasScheme = (prod: ProductItem | { id: string } | null) => {
		if (!prod) return false;
		if (activeSchemeProductIds?.has(prod.id)) return true;
		if ((prod as any).tradeScheme != null) return true;
		return false;
	};

	// Find the currently selected product
	const selectedProduct = useMemo(() => {
		const inLocal = availableProducts.find((p) => p.id === selectedProductId);
		if (inLocal) return inLocal;
		const inApi = apiResults.find((p) => p.id === selectedProductId);
		return inApi || null;
	}, [selectedProductId, availableProducts, apiResults]);

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
			setApiResults([]);
			setIsSearchingApi(false);
			return;
		}

		setIsSearchingApi(true);
		const timer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/products?search=${encodeURIComponent(trimmed)}&page=1`);
				if (res.ok) {
					const json = await res.json();
					if (json.success && Array.isArray(json.data)) {
						setApiResults(json.data);
					}
				}
			} catch (err) {
				console.error("Failed to search products:", err);
			} finally {
				setIsSearchingApi(false);
			}
		}, 200);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Filtered products: combined local matches + api matches deduplicated
	const displaySuggestions = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) {
			return availableProducts.slice(0, 15);
		}

		const localFiltered = availableProducts.filter(
			(p) =>
				p.name.toLowerCase().includes(query) ||
				p.sku.toLowerCase().includes(query) ||
				p.bikeModel.toLowerCase().includes(query) ||
				p.category.toLowerCase().includes(query)
		);

		// Merge with apiResults avoiding duplicates
		const seenIds = new Set(localFiltered.map((p) => p.id));
		const merged = [...localFiltered];

		for (const p of apiResults) {
			if (!seenIds.has(p.id)) {
				seenIds.add(p.id);
				merged.push(p);
			}
		}

		return merged;
	}, [searchQuery, availableProducts, apiResults]);

	const handleSelect = (product: ProductItem) => {
		onSelectProduct({
			id: product.id,
			name: product.name,
			sku: product.sku,
			price: product.price,
			bikeModel: product.bikeModel,
			category: product.category,
			imageUrl: product.imageUrl || "/logo.png",
		});
		setIsOpen(false);
		setSearchQuery("");
	};

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		setSearchQuery("");
		setIsOpen(true);
		setTimeout(() => inputRef.current?.focus(), 50);
	};

	return (
		<div ref={containerRef} className="relative w-full">
			{/* Selected Product Card or Search Bar */}
			{!isOpen && selectedProduct ? (
				<div
					onClick={() => {
						setIsOpen(true);
						setTimeout(() => inputRef.current?.focus(), 50);
					}}
					className="flex items-center justify-between p-2 rounded-xl border border-input bg-background/80 hover:bg-accent/40 cursor-pointer transition-all shadow-2xs group"
				>
					<div className="flex items-center gap-2.5 min-w-0">
						<div className="relative size-10 rounded-lg overflow-hidden border bg-muted/30 shrink-0 flex items-center justify-center">
							<Image
								src={selectedProduct.imageUrl || "/logo.png"}
								alt={selectedProduct.name}
								fill
								className="object-contain p-1"
							/>
						</div>
						<div className="min-w-0">
							<div className="font-semibold text-xs text-foreground truncate flex items-center gap-1.5 flex-wrap">
								<span>{selectedProduct.name}</span>
								<Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono">
									{selectedProduct.bikeModel}
								</Badge>
								{checkHasScheme(selectedProduct) && (
									<Badge
										variant="outline"
										className="text-[10px] py-0 px-1.5 font-bold border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-300 flex items-center gap-1 shadow-2xs"
									>
										<Sparkles className="size-2.5 text-amber-600" />
										Scheme Already Applied
									</Badge>
								)}
							</div>
							<div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
								<span className="font-mono">{selectedProduct.sku}</span>
								<span>•</span>
								<span className="font-bold text-amber-700 dark:text-amber-400">
									Rs. {selectedProduct.price.toLocaleString()}
								</span>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-1.5 shrink-0 pl-2">
						<Badge
							variant="outline"
							className="text-[10px] bg-background text-muted-foreground group-hover:text-foreground group-hover:border-primary/50 transition-colors"
						>
							Change Part
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
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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
						placeholder="Search spare parts by name, SKU, or bike model..."
						className="h-9.5 pl-9 pr-8 text-xs bg-background font-medium border-primary/40 focus-visible:ring-primary/20 shadow-2xs"
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
			)}

			{/* Floating Suggestions Dropdown */}
			{isOpen && (
				<div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-popover text-popover-foreground border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
					{/* Header note */}
					<div className="px-3 py-1.5 bg-muted/40 border-b flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
						<span className="flex items-center gap-1">
							<Package className="size-3 text-primary" />
							{searchQuery ? `Suggestions for "${searchQuery}"` : "Suggested Products"}
						</span>
						<span className="text-[10px] font-mono">
							{displaySuggestions.length} {displaySuggestions.length === 1 ? "result" : "results"}
						</span>
					</div>

					{/* Suggestions List */}
					<div className="max-h-60 overflow-y-auto divide-y divide-border/40 p-1">
						{displaySuggestions.length > 0 ? (
							displaySuggestions.map((prod) => {
								const isCurrent = prod.id === selectedProductId;
								return (
									<div
										key={prod.id}
										onClick={() => handleSelect(prod)}
										className={`flex items-center justify-between gap-3 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
											isCurrent
												? "bg-primary/10 text-primary font-semibold"
												: "hover:bg-muted/70 text-foreground"
										}`}
									>
										<div className="flex items-center gap-2.5 min-w-0">
											<div className="relative size-8 rounded-md overflow-hidden border bg-background shrink-0 flex items-center justify-center">
												<Image
													src={prod.imageUrl || "/logo.png"}
													alt={prod.name}
													fill
													className="object-contain p-0.5"
												/>
											</div>
											<div className="min-w-0">
												<div className="font-semibold truncate flex items-center gap-1.5 flex-wrap">
													<span>{prod.name}</span>
													{isCurrent && <Check className="size-3 text-primary shrink-0" />}
													{checkHasScheme(prod) && (
														<Badge
															variant="outline"
															className="text-[9px] py-0 px-1 font-bold border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center gap-0.5 shrink-0"
														>
															<Sparkles className="size-2 text-amber-600" />
															Scheme Applied
														</Badge>
													)}
												</div>
												<div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
													<span className="font-mono">{prod.sku}</span>
													<span>•</span>
													<span>{prod.bikeModel}</span>
													<span>•</span>
													<span>{prod.category}</span>
												</div>
											</div>
										</div>

										<div className="text-right shrink-0">
											<div className="font-bold text-xs text-foreground">
												Rs. {prod.price.toLocaleString()}
											</div>
											<div className="text-[10px] text-muted-foreground">
												Wholesale
											</div>
										</div>
									</div>
								);
							})
						) : (
							<div className="py-6 text-center text-xs text-muted-foreground">
								{isSearchingApi ? (
									<div className="flex items-center justify-center gap-2">
										<Loader2 className="size-4 animate-spin text-primary" />
										<span>Searching catalog...</span>
									</div>
								) : (
									<div className="space-y-1">
										<p className="font-semibold">No spare parts found</p>
										<p className="text-[11px] text-muted-foreground">
											Try searching by SKU (e.g. CRN-CD70), bike model, or part name.
										</p>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
