"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Search,
	Download,
	Package,
	Loader2,
	AlertTriangle,
	X,
	Store,
	TrendingUp,
} from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import {
	fetchOrders,
	updateOrderStatus,
	cancelOrder,
} from "@/lib/api/orders/orders-api";
import { INITIAL_ORDERS, type OrderRecord, type OrderStatus } from "./types";
import { OrderStatsCards } from "./order-stats";
import { OrderTable } from "./order-table";
import { InvoiceSheet } from "./invoice-sheet";
import { OrderEditDialog } from "./order-edit-dialog";

export function OrderView() {
	const queryClient = useQueryClient();

	const [selectedType, setSelectedType] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [selectedBranch, setSelectedBranch] = useState<string>("all");
	const [searchInput, setSearchInput] = useState("");
	const [activeSearch, setActiveSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderRecord | null>(null);
	const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
	const [editTargetOrder, setEditTargetOrder] = useState<OrderRecord | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [deleteTargetOrder, setDeleteTargetOrder] = useState<OrderRecord | null>(null);

	const typeTabs = [
		{ id: "all", label: "All Orders" },
		{ id: "Wholesale", label: "Wholesale" },
		{ id: "Retail", label: "Retail" },
	];

	// TanStack Query for 12-item paginated orders
	const { data, isLoading, isError, error } = useQuery({
		queryKey: queryKeys.orders.list({
			page: currentPage,
			search: activeSearch,
			status: selectedStatus,
			type: selectedType,
			branchId: selectedBranch,
		}),
		queryFn: () =>
			fetchOrders({
				page: currentPage,
				search: activeSearch,
				status: selectedStatus,
				type: selectedType,
				branchId: selectedBranch,
			}),
		staleTime: 1000 * 60 * 5,
	});

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setActiveSearch(searchInput.trim());
		setCurrentPage(1);
	};

	const ordersList: OrderRecord[] = data?.data || [];
	const totalPages = data?.pagination?.totalPages || 1;
	const totalCount = data?.pagination?.totalCount || 0;

	// Mutations
	const statusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
			updateOrderStatus(id, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => cancelOrder(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
		},
	});

	const handleOpenInvoice = (order: OrderRecord) => {
		setSelectedInvoiceOrder(order);
		setIsInvoiceOpen(true);
	};

	const handleOpenEdit = (order: OrderRecord) => {
		setEditTargetOrder(order);
		setIsEditDialogOpen(true);
	};

	const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
		statusMutation.mutate({ id: orderId, status: newStatus });
	};

	const handleDeleteOrder = (order: OrderRecord) => {
		setDeleteTargetOrder(order);
	};

	const handleConfirmDelete = () => {
		if (deleteTargetOrder) {
			deleteMutation.mutate(deleteTargetOrder.id);
			setDeleteTargetOrder(null);
		}
	};

	return (
		<div className="flex flex-col gap-6 w-full max-w-full min-w-0">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
							Customer Orders & Invoices
						</h1>
						<Badge variant="outline" className="text-xs font-normal">
							Wholesale & Retail
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Manage spare parts dispatch, billing receipts, and printable thermal invoices for Sarfraz Autos.
					</p>
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					<Link href="/dashboard/reports/top-selling">
						<Button
							variant="outline"
							size="sm"
							className="gap-2 cursor-pointer border-primary/30 text-primary hover:bg-primary/5 text-xs font-semibold"
						>
							<TrendingUp className="size-3.5 text-primary" />
							Top Selling Report
						</Button>
					</Link>
					<Button variant="outline" size="sm" className="gap-2 cursor-pointer text-xs">
						<Download className="size-3.5" />
						Export Invoices
					</Button>
				</div>
			</div>

			{/* 3 Metric Cards */}
			<OrderStatsCards orders={ordersList} />

			{/* Filter Controls Bar */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
				{/* Search Form with Search Button */}
				<form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
						<Input
							placeholder="Search Order ID (#SA-...), dealer, city, product..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-background"
						/>
						{searchInput && (
							<button
								type="button"
								onClick={() => {
									setSearchInput("");
									if (activeSearch) {
										setActiveSearch("");
										setCurrentPage(1);
									}
								}}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
								title="Clear search"
							>
								<X className="size-3.5" />
							</button>
						)}
					</div>
					<Button
						type="submit"
						size="sm"
						className="h-9 px-3.5 gap-1.5 cursor-pointer text-xs font-normal shrink-0"
					>
						<Search className="size-3.5" />
						<span>Search</span>
					</Button>
				</form>

				{/* Filter Controls: Branch Selector & Order Type Tabs */}
				<div className="flex flex-wrap items-center gap-3">
					{/* Branch Filter */}
					<div className="flex items-center gap-1.5">
						<span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1">
							<Store className="size-3" /> Branch:
						</span>
						<Select
							value={selectedBranch}
							onValueChange={(val) => {
								setSelectedBranch(val || "all");
								setCurrentPage(1);
							}}
						>
							<SelectTrigger className="h-8 text-xs min-w-[130px] bg-background">
								<SelectValue placeholder="All Branches" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Branches</SelectItem>
								<SelectItem value="main">Saddar Main</SelectItem>
								<SelectItem value="branch-2">Gulshan Branch</SelectItem>
								<SelectItem value="branch-3">DHA Branch</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Order Type Tabs */}
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-xs text-muted-foreground mr-1 hidden sm:inline-flex items-center gap-1">
							<Package className="size-3" /> Type:
						</span>
						{typeTabs.map((tab) => {
							const active = selectedType === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => {
										setSelectedType(tab.id);
										setCurrentPage(1);
									}}
									className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer ${
										active
											? "bg-primary text-primary-foreground shadow-2xs"
											: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
									}`}
								>
									{tab.label}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Main Order Table with Loading and Error states */}
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border">
					<Loader2 className="size-8 animate-spin text-primary mb-2" />
					<p className="text-xs text-muted-foreground">Loading orders from database...</p>
				</div>
			) : isError ? (
				<div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-destructive/20 text-destructive">
					<AlertTriangle className="size-8 mb-2" />
					<p className="text-sm font-semibold">Failed to load orders</p>
					<p className="text-xs text-muted-foreground mt-1">{(error as Error)?.message}</p>
				</div>
			) : (
				<OrderTable
					orders={ordersList}
					onViewInvoice={handleOpenInvoice}
					onEditOrder={handleOpenEdit}
					onStatusChange={handleStatusChange}
					onDeleteOrder={handleDeleteOrder}
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

			{/* Left-Side Sheet Invoice Drawer with Print Button */}
			<InvoiceSheet
				order={selectedInvoiceOrder}
				isOpen={isInvoiceOpen}
				onClose={() => setIsInvoiceOpen(false)}
			/>

			{/* Comprehensive Order Edit Dialog */}
			<OrderEditDialog
				order={editTargetOrder}
				isOpen={isEditDialogOpen}
				onClose={() => {
					setIsEditDialogOpen(false);
					setEditTargetOrder(null);
				}}
				onOrderUpdated={() => {
					queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
				}}
			/>

			{/* shadcn Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deleteTargetOrder}
				onOpenChange={(open) => !open && setDeleteTargetOrder(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
							<AlertTriangle className="size-5" />
						</div>
						<AlertDialogTitle>Are you sure you want to delete this order?</AlertDialogTitle>
						<AlertDialogDescription>
							This will cancel invoice <span className="font-semibold text-foreground">#{deleteTargetOrder?.invoiceNumber}</span> for <span className="font-semibold text-foreground">{deleteTargetOrder?.customerName}</span> (Rs. {deleteTargetOrder?.totalAmount?.toLocaleString()}) and restore inventory stock to the branch.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeleteTargetOrder(null)} className="cursor-pointer">
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
								"Yes, Delete Order"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
