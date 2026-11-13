import type { ReactNode } from "react";
import {
	LayoutGrid,
	Package,
	PackageSearch,
	PlusCircle,
	FileSpreadsheet,
	BadgeDollarSign,
	BadgePercent,
	ShoppingBag,
	CreditCard,
	Store,
	Users,
	MapPin,
	CalendarCheck,
	History,
	Activity,
	HelpCircle,
	Bell,
} from "lucide-react";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
	{
		items: [
			{
				title: "Overview",
				path: "/dashboard",
				icon: <LayoutGrid className="size-4" />,
			},
		],
	},
	{
		label: "Inventory",
		items: [
			{
				title: "Products",
				icon: <Package className="size-4" />,
				subItems: [
					{
						title: "All Products",
						path: "/dashboard/products",
						icon: <PackageSearch className="size-4" />,
					},
					{
						title: "Add Product",
						path: "/dashboard/products/add",
						icon: <PlusCircle className="size-4" />,
					},
					{
						title: "Excel Product Upload",
						path: "#/products/upload",
						icon: <FileSpreadsheet className="size-4" />,
					},
					{
						title: "Price Updater",
						path: "/dashboard/products/price-updater",
						icon: <BadgeDollarSign className="size-4" />,
					},
				],
			},
			{
				title: "Trade schemes",
				path: "#/trade-schemes",
				icon: <BadgePercent className="size-4" />,
			},
		],
	},
	{
		label: "Sales & Counter",
		items: [
			{
				title: "Counter",
				path: "#/counter",
				icon: <Store className="size-4" />,
			},
			{
				title: "Orders",
				path: "/dashboard/orders",
				icon: <ShoppingBag className="size-4" />,
			},
		],
	},
	{
		label: "Operations",
		items: [
			{
				title: "Team",
				path: "/dashboard/team",
				icon: <Users className="size-4" />,
			},
			{
				title: "Map tracking",
				path: "/dashboard/map",
				icon: <MapPin className="size-4" />,
			},
			{
				title: "Attendance",
				icon: <CalendarCheck className="size-4" />,
				subItems: [
					{
						title: "Daily Attendance",
						path: "/dashboard/attendance",
						icon: <CalendarCheck className="size-4" />,
					},
					{
						title: "Attendance History",
						path: "/dashboard/attendance/history",
						icon: <History className="size-4" />,
					},
				],
			},
		],
	},
	{
		label: "Maintenance",
		items: [
			{
				title: "System health",
				path: "/dashboard/system-health",
				icon: <Activity className="size-4" />,
			},
		],
	},
];

export const footerNavLinks: SidebarNavItem[] = [
	{
		title: "Help Center",
		path: "/dashboard/help",
		icon: <HelpCircle className="size-4" />,
	},
	{
		title: "System health",
		path: "/dashboard/system-health",
		icon: <Activity className="size-4" />,
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item]
		)
	),
	...footerNavLinks,
	{
		title: "Notifications",
		path: "/dashboard/notifications",
		icon: <Bell className="size-4" />,
	},
];
