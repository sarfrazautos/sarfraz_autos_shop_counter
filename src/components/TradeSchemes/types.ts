export type SchemeType = "buy_x_get_y" | "net_rate" | "flat_discount";

export interface TradeScheme {
	id: string; // e.g. "SCH-001"
	title: string; // e.g. "Buy 20 Piston Kits Get 1 Free"
	productId: string; // e.g. "PRD-101"
	productName: string;
	sku: string;
	bikeModel: string;
	category: string;
	regularPrice: number;
	schemeType: SchemeType;
	buyQuantity: number; // e.g. 20
	freeQuantity?: number; // e.g. 1
	freeItemName?: string; // e.g. "Crown QINGQI Piston Kit 70cc (Free)"
	netSchemeRate?: number; // e.g. 1280
	flatDiscount?: number; // e.g. 170
	effectiveSavingsPercent: number; // e.g. 11.7%
	applicableTier: "Wholesale Only" | "All Customers" | "Registered Dealers";
	validFrom: string;
	validTo: string;
	status: "Active" | "Paused" | "Expired";
	totalDispatchedBonus: number; // Total free units or times applied
	remarks?: string;
}

export const INITIAL_TRADE_SCHEMES: TradeScheme[] = [
	{
		id: "SCH-101",
		title: "Buy 20 Piston Kits — Get 1 Kit Free (Bonus Offer)",
		productId: "PRD-101",
		productName: "Crown QINGQI-4ST Piston Kit 70cc",
		sku: "CRN-CD70-PST",
		bikeModel: "Honda CD70",
		category: "Engine & Transmission",
		regularPrice: 1450,
		schemeType: "buy_x_get_y",
		buyQuantity: 20,
		freeQuantity: 1,
		freeItemName: "Same Item: Crown Piston Kit (1x Free)",
		netSchemeRate: 1380,
		effectiveSavingsPercent: 5.0,
		applicableTier: "Wholesale Only",
		validFrom: "01 Nov 2026",
		validTo: "30 Nov 2026",
		status: "Active",
		totalDispatchedBonus: 28,
		remarks: "Official Crown Pakistan November trade campaign",
	},
	{
		id: "SCH-102",
		title: "Clutch Gear Wholesale Net Scheme Rate (Rs. 980)",
		productId: "PRD-102",
		productName: "Crown CD70F Clutch Gear Big (OEM Grade)",
		sku: "CRN-CD70-CLT",
		bikeModel: "Honda CD70",
		category: "Engine & Transmission",
		regularPrice: 1120,
		schemeType: "net_rate",
		buyQuantity: 10,
		freeQuantity: 0,
		netSchemeRate: 980,
		effectiveSavingsPercent: 12.5,
		applicableTier: "Registered Dealers",
		validFrom: "05 Nov 2026",
		validTo: "25 Nov 2026",
		status: "Active",
		totalDispatchedBonus: 64,
		remarks: "Direct net scheme rate applied at counter for 10+ pcs",
	},
	{
		id: "SCH-103",
		title: "Buy 50 NGK Spark Plugs — Get 3 Plugs Free",
		productId: "PRD-110",
		productName: "Crown NGK Spark Plug C7HSA Copper Core",
		sku: "CRN-NGK-C7H",
		bikeModel: "Crown 70cc / Universal",
		category: "Electrical & Lighting",
		regularPrice: 220,
		schemeType: "buy_x_get_y",
		buyQuantity: 50,
		freeQuantity: 3,
		freeItemName: "NGK C7HSA Spark Plugs (3x Free)",
		netSchemeRate: 207,
		effectiveSavingsPercent: 6.0,
		applicableTier: "Wholesale Only",
		validFrom: "01 Nov 2026",
		validTo: "30 Nov 2026",
		status: "Active",
		totalDispatchedBonus: 45,
		remarks: "High runner counter scheme for retail workshops",
	},
	{
		id: "SCH-104",
		title: "Heavy Drive Chain 420 Carton Scheme (Flat Rs. 65 Off)",
		productId: "PRD-104",
		productName: "Crown 420X104L Heavy Duty Wheel Chain",
		sku: "CRN-CHN-420",
		bikeModel: "Honda CD70",
		category: "Chassis & Body",
		regularPrice: 805,
		schemeType: "flat_discount",
		buyQuantity: 25,
		flatDiscount: 65,
		netSchemeRate: 740,
		effectiveSavingsPercent: 8.1,
		applicableTier: "Registered Dealers",
		validFrom: "10 Nov 2026",
		validTo: "30 Nov 2026",
		status: "Active",
		totalDispatchedBonus: 15,
		remarks: "Applicable on full bundle purchase (25 chains)",
	},
	{
		id: "SCH-105",
		title: "Front Brake Shoes Buy 30 Pairs — Get 2 Pairs Free",
		productId: "PRD-109",
		productName: "Crown CD70 Front Brake Shoe Set Asbestos-Free",
		sku: "CRN-CD70-BRK",
		bikeModel: "Honda CD70",
		category: "Brakes & Suspension",
		regularPrice: 310,
		schemeType: "buy_x_get_y",
		buyQuantity: 30,
		freeQuantity: 2,
		freeItemName: "CD70 Brake Shoe Sets (2x Free)",
		netSchemeRate: 290,
		effectiveSavingsPercent: 6.5,
		applicableTier: "All Customers",
		validFrom: "01 Nov 2026",
		validTo: "20 Nov 2026",
		status: "Active",
		totalDispatchedBonus: 18,
		remarks: "Popular workshop promo across Saddar Market",
	},
	{
		id: "SCH-106",
		title: "Clutch Friction Plates CG125 Net Rate Promotion",
		productId: "PRD-111",
		productName: "Crown CG125 Clutch Friction Plates Set (OEM)",
		sku: "CRN-CG125-FPL",
		bikeModel: "Honda CG125",
		category: "Engine & Transmission",
		regularPrice: 980,
		schemeType: "net_rate",
		buyQuantity: 15,
		netSchemeRate: 850,
		effectiveSavingsPercent: 13.2,
		applicableTier: "Wholesale Only",
		validFrom: "01 Nov 2026",
		validTo: "15 Nov 2026",
		status: "Paused",
		totalDispatchedBonus: 12,
		remarks: "Paused due to temporary factory supply delay",
	},
];
