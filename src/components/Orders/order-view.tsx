"use client";

import { useState } from "react";
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
	Search,
	Download,
	Package,
	Loader2,
	AlertTriangle,
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

export function OrderView() {
	const queryClient = useQueryClient();

	const [selectedType, setSelectedType] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderRecord | null>(null);
	const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

	const typeTabs = [
		{ id: "all", label: "All Orders" },
		{ id: "Wholesale", label: "Wholesale" },
		{ id: "Retail", label: "Retail" },
	];

	// TanStack Query for 12-item paginated orders
	const { data, isLoading, isError, error } = useQuery({
		queryKey: queryKeys.orders.list({
			page: currentPage,
			search: searchQuery,
			status: selectedStatus,
			type: selectedType,
		}),
		queryFn: () =>
			fetchOrders({
				page: currentPage,
				search: searchQuery,
				status: selectedStatus,
				type: selectedType,
			}),
		staleTime: 1000 * 60 * 5,
	});

	const ordersList: OrderRecord[] = data?.data && data.data.length > 0 ? data.data : INITIAL_ORDERS;
	const totalPages = data?.pagination?.totalPages || 1;
	const totalCount = data?.pagination?.totalCount || ordersList.length;

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

	const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
		statusMutation.mutate({ id: orderId, status: newStatus });
	};

	const handleDeleteOrder = (orderId: string) => {
		if (confirm("Cancel this order and restore product stock?")) {
			deleteMutation.mutate(orderId);
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

				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" className="gap-2 cursor-pointer">
						<Download className="size-3.5" />
						Export Invoices
					</Button>
				</div>
			</div>

			{/* 3 Metric Cards */}
			<OrderStatsCards orders={ordersList} />

			{/* Filter Controls Bar */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
				{/* Search Bar */}
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
					<Input
						placeholder="Search by Order ID (#SA-...), dealer name, city, or product..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="pl-9 h-9 text-sm"
					/>
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
		</div>
	);
}
