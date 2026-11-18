export type BranchId = "main" | "branch-2" | "branch-3";

export interface BranchInfo {
	id: BranchId;
	name: string;
	shortName: string;
	address: string;
	phone: string;
	manager: string;
}

export const BRANCHES: BranchInfo[] = [
	{
		id: "main",
		name: "1st Branch (Saddar - Main Counter)",
		shortName: "Saddar Main",
		address: "Shop #23, Taj Mahal Qasim Auto Market, Saddar, Karachi",
		phone: "0333-1285556",
		manager: "Sarfraz Ahmed",
	},
	{
		id: "branch-2",
		name: "2nd Branch (Gulshan-e-Iqbal Counter)",
		shortName: "Gulshan Branch",
		address: "Plot 14-C, Block 13-D, Gulshan-e-Iqbal, Karachi",
		phone: "0333-2624410",
		manager: "Tariq Mahmood",
	},
	{
		id: "branch-3",
		name: "3rd Branch (DHA Phase 2 Counter)",
		shortName: "DHA Branch",
		address: "Commercial Area B, Phase 2, DHA, Karachi",
		phone: "0315-2666263",
		manager: "Kashif Raza",
	},
];

export const BIKE_MODELS = [
	"Honda CD70",
	"Honda CG125",
	"Honda CD70 Dream",
	"Honda Pridor 100cc",
	"Suzuki GS150",
	"Suzuki GD110S",
	"Yamaha YBR125",
	"Crown 70cc / Universal",
	"Crown 100cc / 110cc",
	"United US70",
	"Road Prince 70",
	"Universal / All Bikes",
] as const;

export type BikeModelType = (typeof BIKE_MODELS)[number] | string;

export interface CounterCartItem {
	id: string;
	productId?: string;
	sku?: string;
	name: string;
	bikeModel: BikeModelType;
	category: string;
	rate: number;
	retailRate: number;
	wholesaleRate: number;
	schemeRate?: number;
	isSchemeActive?: boolean;
	isSchemeDisabled?: boolean;
	quantity: number;
	unit: string;
	branchStock: number;
	pricingTier: "Retail" | "Wholesale";
	imageUrl?: string;
	tradeScheme?: {
		id: string;
		title: string;
		schemeType: "buy_x_get_y" | "net_rate" | "flat_discount";
		buyQuantity: number;
		freeQuantity: number;
		netSchemeRate?: number | null;
		applicableTier?: string;
		status: string;
	} | null;
}

export interface CustomerProfile {
	id?: string;
	name: string;
	phone: string;
	city: string;
	route?: string;
	salesman?: string;
	type: "Retail Customer" | "Wholesale Dealer" | "Workshop / Mechanic";
	paymentMethod: "Cash on Counter" | "Online Transfer" | "Credit / Khata";
	openingBalance?: number;
	currentBalance?: number;
	creditLimit?: number;
}

export const DEFAULT_WALKIN_CUSTOMER: CustomerProfile = {
	id: "walkin",
	name: "Walk-in Wholesale Dealer",
	phone: "",
	city: "Karachi",
	route: "Saddar Counter",
	salesman: "Counter Cashier",
	type: "Wholesale Dealer",
	paymentMethod: "Cash on Counter",
	openingBalance: 0,
	currentBalance: 0,
	creditLimit: 0,
};

export const FREQUENT_CUSTOMERS: CustomerProfile[] = [];

export const COMMON_COUNTER_ITEMS = [
	{
		name: "Crown QINGQI Piston Kit",
		bikeModel: "Honda CD70",
		category: "Engine & Transmission",
		retailPrice: 1650,
		wholesalePrice: 1450,
		unit: "Kit",
		imageUrl: "/logo.png",
	},
	{
		name: "Crown Clutch Gear Big OEM",
		bikeModel: "Honda CD70",
		category: "Engine & Transmission",
		retailPrice: 1250,
		wholesalePrice: 1120,
		unit: "Pcs",
		imageUrl: "/logo.png",
	},
	{
		name: "Crown Rear Wheel Sleeve",
		bikeModel: "Honda CD70",
		category: "Tyres & Wheels",
		retailPrice: 95,
		wholesalePrice: 78,
		unit: "Pcs",
		imageUrl: "/logo.png",
	},
	{
		name: "Crown 420 Heavy Drive Chain",
		bikeModel: "Honda CD70",
		category: "Chassis & Body",
		retailPrice: 920,
		wholesalePrice: 805,
		unit: "Pcs",
		imageUrl: "/logo.png",
	},
	{
		name: "Crown CD70 Front Brake Shoe",
		bikeModel: "Honda CD70",
		category: "Brakes & Suspension",
		retailPrice: 380,
		wholesalePrice: 310,
		unit: "Sets",
		imageUrl: "/logo.png",
	},
	{
		name: "Crown Clutch Friction Plates",
		bikeModel: "Honda CG125",
		category: "Engine & Transmission",
		retailPrice: 1150,
		wholesalePrice: 980,
		unit: "Sets",
		imageUrl: "/logo.png",
	},
	{
		name: "Crown CG125 Head Light Unit",
		bikeModel: "Honda CG125",
		category: "Electrical & Lighting",
		retailPrice: 890,
		wholesalePrice: 750,
		unit: "Pcs",
		imageUrl: "/logo.png",
	},
	{
		name: "Crown NGK Spark Plug C7HSA",
		bikeModel: "Crown 70cc / Universal",
		category: "Electrical & Lighting",
		retailPrice: 280,
		wholesalePrice: 220,
		unit: "Pcs",
		imageUrl: "/logo.png",
	},
];
