"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Search,
	Trash2,
	Plus,
	SlidersHorizontal,
	Building2,
	AlertTriangle,
	Filter,
	Loader2,
} from "lucide-react";

import { queryKeys } from "@/lib/query-keys";
import {
	fetchProducts,
	deleteProduct,
	adjustProductStock,
} from "@/lib/api/products/products-api";
import type { ProductItem } from "./types";
import { ProductStatsCards } from "./product-stats";
import { ProductTable } from "./product-table";
import { ProductDetailDialog } from "./product-detail-dialog";
import { QuickStockDialog } from "./quick-stock-dialog";

export function ProductsView() {
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedBranch, setSelectedBranch] = useState<"all" | "main" | "branch-2" | "branch-3">("all");
	const [selectedModel, setSelectedModel] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);

	// Multi-select state
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	// Dialog states
	const [viewProduct, setViewProduct] = useState<ProductItem | null>(null);
	const [stockProduct, setStockProduct] = useState<ProductItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
	const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

	const branchTabs = [
		{ id: "all" as const, label: "All Branches" },
		{ id: "main" as const, label: "1st Branch (Saddar)" },
		{ id: "branch-2" as const, label: "2nd Branch (Gulshan)" },
		{ id: "branch-3" as const, label: "3rd Branch (DHA)" },
	];

	const bikeModelFilters = [
		"all",
		"Honda CD70",
		"Honda CG125",
		"Honda CD70 Dream",
		"Suzuki GS150",
		"Yamaha YBR125",
	];

	const statusFilters = [
		{ id: "all", label: "All Stock Status" },
		{ id: "In Stock", label: "In Stock" },
		{ id: "Low Stock", label: "Low Stock" },
		{ id: "Out of Stock", label: "Out of Stock" },
	];

	// TanStack Query for 12-item paginated server data with caching
	const { data, isLoading, isError, error } = useQuery({
		queryKey: queryKeys.products.list({
			page: currentPage,
			search: searchQuery,
			branchId: selectedBranch,
			bikeModel: selectedModel,
			status: selectedStatus,
		}),
		queryFn: () =>
			fetchProducts({
				page: currentPage,
				search: searchQuery,
				branchId: selectedBranch,
				bikeModel: selectedModel,
				status: selectedStatus,
			}),
		staleTime: 1000 * 60 * 5, // 5 minutes fresh in cache
	});

	const products: ProductItem[] = data?.data || [];
	const totalPages = data?.pagination?.totalPages || 1;
	const totalCount = data?.pagination?.totalCount || 0;

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteProduct(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
			setDeleteTarget(null);
		},
	});

	// Stock adjustment mutation
	const stockMutation = useMutation({
		mutationFn: (payload: { productId: string; branchId: string; quantityChange: number }) =>
			adjustProductStock(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
			setStockProduct(null);
		},
	});

	// Handlers
	const handleToggleSelectAll = () => {
		if (selectedIds.length === products.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(products.map((p) => p.id));
		}
	};

	const handleToggleSelectOne = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
		);
	};

	const handleConfirmSingleDelete = () => {
		if (!deleteTarget) return;
		deleteMutation.mutate(deleteTarget.id);
	};

	const handleConfirmBulkDelete = async () => {
		for (const id of selectedIds) {
			await deleteProduct(id);
		}
		queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
		setSelectedIds([]);
		setBulkDeleteConfirmOpen(false);
	};

	const handleAddStock = (
		productId: string,
		branchId: "main" | "branch-2" | "branch-3",
		addedQty: number
	) => {
		stockMutation.mutate({
			productId,
			branchId,
			quantityChange: addedQty,
		});
	};

	return (
		<div className="flex flex-col gap-6 w-full max-w-full min-w-0">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
							Inventory & All Products
						</h1>
						<Badge variant="outline" className="text-xs font-normal">
							Master Parts Catalog
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Browse, restock, monitor low-threshold alerts, and manage branch stock across Sarfraz Autos.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="text-xs gap-1.5"
						render={<Link href="/dashboard/products/price-updater" />}
						nativeButton={false}
					>
						<SlidersHorizontal className="size-3.5" />
						Price Updater
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="text-xs gap-1.5"
						render={<Link href="/dashboard/trade-schemes" />}
						nativeButton={false}
					>
						Trade Schemes
					</Button>
					<Button
						size="sm"
						className="text-xs gap-1.5"
						render={<Link href="/dashboard/products/add" />}
						nativeButton={false}
					>
						<Plus className="size-3.5" />
						Add New Product
					</Button>
				</div>
			</div>

			{/* Top Stats Cards */}
			<ProductStatsCards products={products} />

			{/* Branch Location Switcher Tabs */}
			<div className="flex items-center gap-1.5 border-b pb-2 overflow-x-auto">
				{branchTabs.map((tab) => {
					const isActive = selectedBranch === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => {
								setSelectedBranch(tab.id);
								setCurrentPage(1);
							}}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
								isActive
									? "bg-primary text-primary-foreground shadow-xs"
									: "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						>
							<Building2 className="size-3.5" />
							{tab.label}
						</button>
					);
				})}
			</div>

			{/* Search, Filter & Bulk Action Toolbar */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="flex flex-1 items-center gap-2 max-w-lg">
					<div className="relative flex-1">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder="Search by part name, SKU, category, or motorcycle..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setCurrentPage(1);
							}}
							className="pl-9 h-9 text-xs"
						/>
					</div>

					{/* Bike Model Filter */}
					<Select
						value={selectedModel}
						onValueChange={(val) => {
							if (val) {
								setSelectedModel(val);
								setCurrentPage(1);
							}
						}}
					>
						<SelectTrigger className="h-9 text-xs w-[140px] shrink-0">
							<SelectValue placeholder="All Models" />
						</SelectTrigger>
						<SelectContent>
							{bikeModelFilters.map((model) => (
								<SelectItem key={model} value={model} className="text-xs">
									{model === "all" ? "All Models" : model}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Stock Status Filter */}
					<Select
						value={selectedStatus}
						onValueChange={(val) => {
							if (val) {
								setSelectedStatus(val);
								setCurrentPage(1);
							}
						}}
					>
						<SelectTrigger className="h-9 text-xs w-[130px] shrink-0">
							<SelectValue placeholder="All Status" />
						</SelectTrigger>
						<SelectContent>
							{statusFilters.map((st) => (
								<SelectItem key={st.id} value={st.id} className="text-xs">
									{st.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Right Side: Bulk Actions & Results Count */}
				<div className="flex items-center gap-2 justify-end">
					{selectedIds.length > 0 && (
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setBulkDeleteConfirmOpen(true)}
							className="text-xs gap-1.5 h-9 animate-in fade-in cursor-pointer"
						>
							<Trash2 className="size-3.5" />
							Delete Selected ({selectedIds.length})
						</Button>
					)}
					<span className="text-xs text-muted-foreground whitespace-nowrap">
						Showing <strong>{products.length}</strong> of <strong>{totalCount}</strong> parts (12/page)
					</span>
				</div>
			</div>

			{/* Products Table with 12 items server pagination */}
			<div className="space-y-4">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border">
						<Loader2 className="size-8 animate-spin text-primary mb-2" />
						<p className="text-xs text-muted-foreground">Loading catalog from database...</p>
					</div>
				) : isError ? (
					<div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-destructive/20 text-destructive">
						<AlertTriangle className="size-8 mb-2" />
						<p className="text-sm font-semibold">Failed to load products</p>
						<p className="text-xs text-muted-foreground mt-1">{(error as Error)?.message}</p>
					</div>
				) : (
					<ProductTable
						products={products}
						selectedIds={selectedIds}
						onToggleSelectAll={handleToggleSelectAll}
						onToggleSelectOne={handleToggleSelectOne}
						onViewProduct={(p: ProductItem) => setViewProduct(p)}
						onAddStock={(p: ProductItem) => setStockProduct(p)}
						onDeleteProduct={(p: ProductItem) => setDeleteTarget(p)}
					/>
				)}

				{/* 12-Item Server Pagination */}
				{totalPages > 1 && (
					<Pagination className="justify-center sm:justify-end">
						<PaginationContent>
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

							{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
								<PaginationItem key={page}>
									<PaginationLink
										href="#"
										isActive={page === currentPage}
										onClick={(e) => {
											e.preventDefault();
											setCurrentPage(page);
										}}
										className="cursor-pointer"
									>
										{page}
									</PaginationLink>
								</PaginationItem>
							))}

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
				)}
			</div>

			{/* Product Detail Dialog */}
			<ProductDetailDialog
				product={viewProduct}
				isOpen={!!viewProduct}
				onClose={() => setViewProduct(null)}
			/>

			{/* Quick Restock Dialog */}
			<QuickStockDialog
				product={stockProduct}
				isOpen={!!stockProduct}
				onClose={() => setStockProduct(null)}
				onAddStock={handleAddStock}
			/>

			{/* Delete Confirmation Alert Dialog (Single Item) */}
			<AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
							<AlertTriangle className="size-5" />
						</div>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove <span className="font-semibold text-foreground">{deleteTarget?.name}</span> ({deleteTarget?.sku}) from the Sarfraz Autos master parts catalog across all 3 branches.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeleteTarget(null)} className="cursor-pointer">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmSingleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
						>
							Delete Product
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Bulk Delete Confirmation Alert Dialog */}
			<AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
							<AlertTriangle className="size-5" />
						</div>
						<AlertDialogTitle>Delete {selectedIds.length} Selected Products?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. All {selectedIds.length} chosen spare parts will be removed from your catalog and inventory records.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setBulkDeleteConfirmOpen(false)} className="cursor-pointer">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmBulkDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
						>
							Delete All Selected
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
