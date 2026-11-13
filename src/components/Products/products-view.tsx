"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
	Package,
	Search,
	Trash2,
	Plus,
	SlidersHorizontal,
	Download,
	Store,
	Building2,
	MapPin,
	CheckCircle2,
	AlertTriangle,
	Filter,
	Bike,
} from "lucide-react";

import { INITIAL_PRODUCTS, type ProductItem, type BikeModel, type ProductCategory } from "./types";
import { ProductStatsCards } from "./product-stats";
import { ProductTable } from "./product-table";
import { ProductDetailDialog } from "./product-detail-dialog";
import { QuickStockDialog } from "./quick-stock-dialog";

const ITEMS_PER_PAGE = 12;

export function ProductsView() {
	const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
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

	// Filter logic
	const filteredProducts = useMemo(() => {
		return products.filter((p) => {
			const matchesModel = selectedModel === "all" || p.bikeModel === selectedModel;
			const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;

			const matchesBranch =
				selectedBranch === "all" ||
				(p.branches.find((b) => b.branchId === selectedBranch)?.stock ?? 0) > 0;

			const q = searchQuery.trim().toLowerCase();
			if (!q) return matchesModel && matchesStatus && matchesBranch;

			const matchesQuery =
				p.name.toLowerCase().includes(q) ||
				p.sku.toLowerCase().includes(q) ||
				p.category.toLowerCase().includes(q) ||
				(p.type && p.type.toLowerCase().includes(q)) ||
				p.bikeModel.toLowerCase().includes(q);

			return matchesModel && matchesStatus && matchesBranch && matchesQuery;
		});
	}, [products, selectedModel, selectedStatus, selectedBranch, searchQuery]);

	// Pagination slicing
	const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
	const paginatedProducts = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredProducts, currentPage]);

	// Handlers
	const handleToggleSelectAll = () => {
		if (selectedIds.length === paginatedProducts.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(paginatedProducts.map((p) => p.id));
		}
	};

	const handleToggleSelectOne = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
		);
	};

	const handleConfirmSingleDelete = () => {
		if (!deleteTarget) return;
		setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
		setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
		setDeleteTarget(null);
	};

	const handleConfirmBulkDelete = () => {
		setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
		setSelectedIds([]);
		setBulkDeleteConfirmOpen(false);
	};

	const handleAddStock = (
		productId: string,
		branchId: "main" | "branch-2" | "branch-3",
		addedQty: number
	) => {
		setProducts((prev) =>
			prev.map((p) => {
				if (p.id !== productId) return p;
				const updatedBranches = p.branches.map((b) =>
					b.branchId === branchId ? { ...b, stock: b.stock + addedQty } : b
				);
				const newTotal = updatedBranches.reduce((acc, b) => acc + b.stock, 0);
				const newStatus =
					newTotal === 0
						? "Out of Stock"
						: newTotal <= p.lowStockThreshold
						? "Low Stock"
						: "In Stock";

				return {
					...p,
					totalStock: newTotal,
					status: newStatus,
					branches: updatedBranches,
					updatedAt: "Just now",
				};
			})
		);
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
					{selectedIds.length > 0 && (
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setBulkDeleteConfirmOpen(true)}
							className="gap-2 cursor-pointer shadow-xs animate-in fade-in-50"
						>
							<Trash2 className="size-3.5" />
							Delete Selected ({selectedIds.length})
						</Button>
					)}

					<Button variant="outline" size="sm" className="gap-2 cursor-pointer">
						<Download className="size-3.5" />
						Export CSV
					</Button>

					<Button
						size="sm"
						className="gap-1.5 cursor-pointer shadow-xs"
						render={<Link href="/dashboard/products/add" />}
						nativeButton={false}
					>
						<Plus className="size-3.5" />
						Add Product
					</Button>
				</div>
			</div>

			{/* Top Stats Cards */}
			<ProductStatsCards products={products} />

			{/* Filter & Search Bar with Compact Dropdowns */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
				{/* Search Bar */}
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
					<Input
						placeholder="Search product name, SKU (e.g. CRN-CD70)..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="pl-9 h-9 text-sm"
					/>
				</div>

				{/* Dropdowns Row: Branch, Bike Model, Stock Status */}
				<div className="flex flex-wrap items-center gap-2">
					{/* 1. Branch Dropdown */}
					<Select
						value={selectedBranch}
						onValueChange={(val) => {
							if (val) {
								setSelectedBranch(val as typeof selectedBranch);
								setCurrentPage(1);
							}
						}}
					>
						<SelectTrigger className="h-9 min-w-[145px] text-xs">
							<Store className="size-3.5 text-muted-foreground mr-1" />
							<SelectValue placeholder="Branch" />
						</SelectTrigger>
						<SelectContent>
							{branchTabs.map((b) => (
								<SelectItem key={b.id} value={b.id} className="text-xs">
									{b.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* 2. Bike Model Dropdown */}
					<Select
						value={selectedModel}
						onValueChange={(val) => {
							if (val) {
								setSelectedModel(val);
								setCurrentPage(1);
							}
						}}
					>
						<SelectTrigger className="h-9 min-w-[150px] text-xs">
							<Bike className="size-3.5 text-muted-foreground mr-1" />
							<SelectValue placeholder="Bike Model" />
						</SelectTrigger>
						<SelectContent>
							{bikeModelFilters.map((m) => (
								<SelectItem key={m} value={m} className="text-xs">
									{m === "all" ? "All Bike Models" : m}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* 3. Stock Status Dropdown */}
					<Select
						value={selectedStatus}
						onValueChange={(val) => {
							if (val) {
								setSelectedStatus(val);
								setCurrentPage(1);
							}
						}}
					>
						<SelectTrigger className="h-9 min-w-[140px] text-xs">
							<Filter className="size-3.5 text-muted-foreground mr-1" />
							<SelectValue placeholder="Stock Status" />
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
			</div>

			{/* Products Data Table */}
			<ProductTable
				products={paginatedProducts}
				selectedIds={selectedIds}
				onToggleSelectAll={handleToggleSelectAll}
				onToggleSelectOne={handleToggleSelectOne}
				onViewProduct={(product) => setViewProduct(product)}
				onAddStock={(product) => setStockProduct(product)}
				onDeleteProduct={(product) => setDeleteTarget(product)}
			/>

			{/* Pagination Controls */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
				<p className="text-xs text-muted-foreground font-mono">
					Showing {paginatedProducts.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{" "}
					{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} items
				</p>

				{totalPages > 1 && (
					<Pagination className="mx-0 w-auto justify-end">
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

