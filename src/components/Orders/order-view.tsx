"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	ShoppingBag,
	Search,
	Filter,
	Download,
	Plus,
	Building2,
	Package,
} from "lucide-react";
import { INITIAL_ORDERS, type OrderRecord, type OrderStatus, type OrderType } from "./types";
import { OrderStatsCards } from "./order-stats";
import { OrderTable } from "./order-table";
import { InvoiceSheet } from "./invoice-sheet";

export function OrderView() {
	const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
	const [selectedType, setSelectedType] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderRecord | null>(null);
	const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

	const typeTabs = [
		{ id: "all", label: "All Orders" },
		{ id: "Wholesale", label: "Wholesale" },
		{ id: "Retail", label: "Retail" },
	];

	const statusFilters = [
		{ id: "all", label: "All Status" },
		{ id: "Completed", label: "Completed" },
		{ id: "In-Progress", label: "In-Progress" },
		{ id: "Pending", label: "Pending" },
		{ id: "Cancelled", label: "Cancelled" },
	];

	const handleOpenInvoice = (order: OrderRecord) => {
		setSelectedInvoiceOrder(order);
		setIsInvoiceOpen(true);
	};

	const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
		setOrders((prev) =>
			prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
		);
	};

	const handleDeleteOrder = (orderId: string) => {
		setOrders((prev) => prev.filter((o) => o.id !== orderId));
	};

	const filteredOrders = useMemo(() => {
		return orders.filter((order) => {
			const matchesType = selectedType === "all" || order.type === selectedType;
			const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;

			const q = searchQuery.trim().toLowerCase();
			if (!q) return matchesType && matchesStatus;

			const matchesQuery =
				order.id.toLowerCase().includes(q) ||
				order.invoiceNumber.toLowerCase().includes(q) ||
				order.customerName.toLowerCase().includes(q) ||
				order.customerCity.toLowerCase().includes(q) ||
				order.items.some((i) => i.name.toLowerCase().includes(q));

			return matchesType && matchesStatus && matchesQuery;
		});
	}, [orders, selectedType, selectedStatus, searchQuery]);

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
			<OrderStatsCards orders={orders} />

			{/* Filter Controls Bar */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
				{/* Search Bar */}
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
					<Input
						placeholder="Search by Order ID (#SA-...), dealer name, city, or product..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
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
								onClick={() => setSelectedType(tab.id)}
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

			{/* Main Order Table */}
			<OrderTable
				orders={filteredOrders}
				onViewInvoice={handleOpenInvoice}
				onStatusChange={handleStatusChange}
				onDeleteOrder={handleDeleteOrder}
			/>

			{/* Left-Side Sheet Invoice Drawer with Print Button */}
			<InvoiceSheet
				order={selectedInvoiceOrder}
				isOpen={isInvoiceOpen}
				onClose={() => setIsInvoiceOpen(false)}
			/>
		</div>
	);
}

