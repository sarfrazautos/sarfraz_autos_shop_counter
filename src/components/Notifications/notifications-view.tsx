"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
	Bell,
	CheckCheck,
	Trash2,
	ShoppingBag,
	AlertTriangle,
	CalendarCheck,
	BadgeDollarSign,
	Activity,
	Store,
	Check,
	Clock,
	ArrowRight,
	ExternalLink,
	Filter,
	Sparkles,
	PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type NotificationType = "orders" | "stock" | "attendance" | "pricing" | "system";

export interface NotificationItem {
	id: string;
	title: string;
	description: string;
	type: NotificationType;
	time: string;
	timestamp: string;
	branch?: string;
	read: boolean;
	actionUrl?: string;
	actionLabel?: string;
	urgent?: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
	{
		id: "NOTIF-101",
		title: "Critical Low Stock: Crown CD70 Piston Kit",
		description: "Only 8 kits remaining in Saddar Branch. Threshold is 15. Reorder suggested for peak weekend sales.",
		type: "stock",
		time: "12m ago",
		timestamp: "Today, 03:45 PM",
		branch: "Saddar (Main)",
		read: false,
		urgent: true,
		actionUrl: "/dashboard/products",
		actionLabel: "Restock Part",
	},
	{
		id: "NOTIF-102",
		title: "New Wholesale Order Received (#SA-64276)",
		description: "Dealer Afraz (Karachi) created order for Rs. 1,762 (5 spare part items) via Counter Credit.",
		type: "orders",
		time: "35m ago",
		timestamp: "Today, 03:22 PM",
		branch: "Gulshan Branch",
		read: false,
		urgent: false,
		actionUrl: "/dashboard/orders",
		actionLabel: "View Invoice",
	},
	{
		id: "NOTIF-103",
		title: "Out of Stock Warning: Yamaha YBR Brake Pads",
		description: "Stock completely depleted (0 pcs) in 3rd Branch (DHA). Walking customers requesting availability.",
		type: "stock",
		time: "1h ago",
		timestamp: "Today, 02:50 PM",
		branch: "DHA Branch",
		read: false,
		urgent: true,
		actionUrl: "/dashboard/products",
		actionLabel: "Transfer Stock",
	},
	{
		id: "NOTIF-104",
		title: "Staff Check-in: Bilal Khan (Gulshan)",
		description: "Technician Bilal Khan clocked in at 09:12 AM (On-Time) at Gulshan Branch Counter.",
		type: "attendance",
		time: "4h ago",
		timestamp: "Today, 09:12 AM",
		branch: "Gulshan Branch",
		read: true,
		urgent: false,
		actionUrl: "/dashboard/attendance/history",
		actionLabel: "Attendance Log",
	},
	{
		id: "NOTIF-105",
		title: "Bulk Price Adjustment Applied (+10%)",
		description: "Successfully updated retail and wholesale rates for 20 spare parts under Engine & Transmission.",
		type: "pricing",
		time: "Yesterday",
		timestamp: "12 Nov, 05:40 PM",
		branch: "Head Office",
		read: true,
		urgent: false,
		actionUrl: "/dashboard/products/price-updater",
		actionLabel: "Price Updater",
	},
	{
		id: "NOTIF-106",
		title: "Order Dispatched (#SA-56143)",
		description: "Large shipment of Crown CD70F Clutch Gears dispatched to Zubair Auto Works. Total: Rs. 73,438.",
		type: "orders",
		time: "Yesterday",
		timestamp: "12 Nov, 03:15 PM",
		branch: "Saddar (Main)",
		read: true,
		urgent: false,
		actionUrl: "/dashboard/orders",
		actionLabel: "Order Details",
	},
	{
		id: "NOTIF-107",
		title: "POS System Health: All Terminals Synced",
		description: "Daily automated database replication completed for 3 branches with 0 latency errors.",
		type: "system",
		time: "2 days ago",
		timestamp: "11 Nov, 11:30 PM",
		branch: "All Branches",
		read: true,
		urgent: false,
		actionUrl: "/dashboard/system-health",
		actionLabel: "System Status",
	},
];

export function NotificationsView() {
	const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
	const [selectedTab, setSelectedTab] = useState<"all" | "unread" | NotificationType>("all");

	// Mark all as read
	const handleMarkAllAsRead = () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
	};

	// Clear all read
	const handleClearRead = () => {
		setNotifications((prev) => prev.filter((n) => !n.read));
	};

	// Toggle individual read
	const handleToggleRead = (id: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
		);
	};

	// Delete individual notification
	const handleDelete = (id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	};

	// Unread count
	const unreadCount = notifications.filter((n) => !n.read).length;

	// Filter notifications
	const filteredNotifications = useMemo(() => {
		return notifications.filter((n) => {
			if (selectedTab === "all") return true;
			if (selectedTab === "unread") return !n.read;
			return n.type === selectedTab;
		});
	}, [notifications, selectedTab]);

	// Render notification icon based on type
	const getTypeIcon = (type: NotificationType) => {
		switch (type) {
			case "stock":
				return <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />;
			case "orders":
				return <ShoppingBag className="size-4 text-sky-600 dark:text-sky-400" />;
			case "attendance":
				return <CalendarCheck className="size-4 text-emerald-600 dark:text-emerald-400" />;
			case "pricing":
				return <BadgeDollarSign className="size-4 text-purple-600 dark:text-purple-400" />;
			case "system":
				return <Activity className="size-4 text-blue-600 dark:text-blue-400" />;
			default:
				return <Bell className="size-4 text-muted-foreground" />;
		}
	};

	// Badge color per type
	const getTypeBadge = (type: NotificationType) => {
		switch (type) {
			case "stock":
				return (
					<Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
						Inventory Alert
					</Badge>
				);
			case "orders":
				return (
					<Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20">
						Counter Order
					</Badge>
				);
			case "attendance":
				return (
					<Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
						Staff Attendance
					</Badge>
				);
			case "pricing":
				return (
					<Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
						Price Engine
					</Badge>
				);
			case "system":
				return (
					<Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
						System Health
					</Badge>
				);
		}
	};

	return (
		<div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-16">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
				<div>
					<div className="flex items-center gap-2.5">
						<div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
							<Bell className="size-4" />
						</div>
						<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
							Notifications
							{unreadCount > 0 && (
								<Badge className="bg-rose-500 text-white font-mono text-xs">
									{unreadCount} Unread
								</Badge>
							)}
						</h1>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Live shop alerts for customer orders, critical low stock warnings, staff check-ins, and system health.
					</p>
				</div>

				{/* Top Global Actions */}
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleMarkAllAsRead}
						disabled={unreadCount === 0}
						className="text-xs gap-1.5 h-8 cursor-pointer"
					>
						<CheckCheck className="size-3.5" />
						Mark All as Read
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleClearRead}
						className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5 cursor-pointer"
					>
						<Trash2 className="size-3" />
						Clear Read
					</Button>
				</div>
			</div>

			{/* Filter Tabs Row */}
			<div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b">
				<button
					type="button"
					onClick={() => setSelectedTab("all")}
					className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border whitespace-nowrap ${
						selectedTab === "all"
							? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
							: "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
					}`}
				>
					<span>All Notifications</span>
					<span className="font-mono text-[10px] opacity-80">({notifications.length})</span>
				</button>

				<button
					type="button"
					onClick={() => setSelectedTab("unread")}
					className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border whitespace-nowrap ${
						selectedTab === "unread"
							? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
							: "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
					}`}
				>
					<span>Unread</span>
					{unreadCount > 0 && (
						<span className="size-2 rounded-full bg-rose-500 inline-block" />
					)}
					<span className="font-mono text-[10px] opacity-80">({unreadCount})</span>
				</button>

				<button
					type="button"
					onClick={() => setSelectedTab("stock")}
					className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border whitespace-nowrap ${
						selectedTab === "stock"
							? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
							: "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
					}`}
				>
					<AlertTriangle className="size-3 text-amber-500" />
					<span>Stock Alerts</span>
				</button>

				<button
					type="button"
					onClick={() => setSelectedTab("orders")}
					className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border whitespace-nowrap ${
						selectedTab === "orders"
							? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
							: "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
					}`}
				>
					<ShoppingBag className="size-3 text-sky-500" />
					<span>Orders</span>
				</button>

				<button
					type="button"
					onClick={() => setSelectedTab("attendance")}
					className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border whitespace-nowrap ${
						selectedTab === "attendance"
							? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
							: "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
					}`}
				>
					<CalendarCheck className="size-3 text-emerald-500" />
					<span>Staff Check-ins</span>
				</button>

				<button
					type="button"
					onClick={() => setSelectedTab("pricing")}
					className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border whitespace-nowrap ${
						selectedTab === "pricing"
							? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
							: "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
					}`}
				>
					<BadgeDollarSign className="size-3 text-purple-500" />
					<span>Pricing</span>
				</button>
			</div>

			{/* Notifications List */}
			<div className="flex flex-col gap-2.5">
				{filteredNotifications.length > 0 ? (
					filteredNotifications.map((item) => (
						<div
							key={item.id}
							className={`rounded-xl border p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
								item.read
									? "bg-card/40 border-border hover:bg-card/80 opacity-90"
									: "bg-card border-primary/20 shadow-xs ring-1 ring-primary/10"
							}`}
						>
							{/* Left content: Icon, Badges, Title, Desc */}
							<div className="flex items-start gap-3.5 flex-1 min-w-0">
								{/* Type Icon Container */}
								<div
									className={`size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
										item.urgent
											? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
											: "bg-muted/60 border"
									}`}
								>
									{getTypeIcon(item.type)}
								</div>

								{/* Main text */}
								<div className="space-y-1 flex-1 min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										{!item.read && (
											<span className="size-2 rounded-full bg-primary inline-block shrink-0" />
										)}
										{getTypeBadge(item.type)}
										{item.branch && (
											<span className="text-[10px] text-muted-foreground flex items-center gap-1">
												<Store className="size-3" />
												{item.branch}
											</span>
										)}
										<span className="text-[10px] text-muted-foreground/70 font-mono">
											• {item.time}
										</span>
									</div>

									<h4
										className={`text-sm leading-snug ${
											item.read
												? "font-medium text-foreground"
												: "font-semibold text-foreground"
										}`}
									>
										{item.title}
									</h4>
									<p className="text-xs text-muted-foreground leading-relaxed">
										{item.description}
									</p>
								</div>
							</div>

							{/* Right: Actions */}
							<div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
								{/* Destination Link Button */}
								{item.actionUrl && (
									<Button
										size="sm"
										variant={item.read ? "outline" : "default"}
										className="h-7 text-xs gap-1.5 cursor-pointer font-medium"
										render={<Link href={item.actionUrl} />}
										nativeButton={false}
									>
										<span>{item.actionLabel || "View"}</span>
										<ArrowRight className="size-3" />
									</Button>
								)}

								{/* Toggle Read */}
								<button
									type="button"
									onClick={() => handleToggleRead(item.id)}
									title={item.read ? "Mark as unread" : "Mark as read"}
									className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
								>
									{item.read ? (
										<span className="size-3.5 rounded-full border border-muted-foreground/50 inline-block" />
									) : (
										<Check className="size-3.5 text-primary stroke-[3]" />
									)}
								</button>

								{/* Delete single notification */}
								<button
									type="button"
									onClick={() => handleDelete(item.id)}
									title="Dismiss notification"
									className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-md hover:bg-muted transition-colors cursor-pointer"
								>
									<Trash2 className="size-3.5" />
								</button>
							</div>
						</div>
					))
				) : (
					/* Empty State */
					<div className="rounded-xl border border-dashed bg-card/40 p-12 text-center flex flex-col items-center justify-center gap-3">
						<div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
							<PackageCheck className="size-6" />
						</div>
						<div className="space-y-1">
							<h3 className="font-heading text-base font-semibold text-foreground">
								All Caught Up!
							</h3>
							<p className="text-xs text-muted-foreground max-w-sm">
								No notifications match this filter. When low stock warnings, new counter sales, or staff updates occur, they will appear here in real-time.
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSelectedTab("all")}
							className="mt-2 text-xs"
						>
							View All Categories
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

