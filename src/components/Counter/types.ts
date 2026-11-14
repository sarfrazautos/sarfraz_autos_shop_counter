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
	quantity: number;
	unit: string;
	branchStock: number;
	pricingTier: "Retail" | "Wholesale";
	imageUrl?: string;
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

export const FREQUENT_CUSTOMERS: CustomerProfile[] = [
	{
		id: "CUST-001",
		name: "Walk-in Retail Rider",
		phone: "0300-0000000",
		city: "Karachi",
		route: "Saddar Counter",
		salesman: "Counter Cashier",
		type: "Retail Customer",
		paymentMethod: "Cash on Counter",
		openingBalance: 0,
		currentBalance: 0,
		creditLimit: 0,
	},
	{
		id: "CUST-002",
		name: "Dilawar Autos Saddar",
		phone: "0321-2244889",
		city: "Karachi",
		route: "Saddar Auto Market",
		salesman: "Tariq Mehmood",
		type: "Wholesale Dealer",
		paymentMethod: "Credit / Khata",
		openingBalance: 45000,
		currentBalance: 87500,
		creditLimit: 150000,
	},
	{
		id: "CUST-003",
		name: "Ahmed Autos Malir",
		phone: "0333-8899112",
		city: "Karachi",
		route: "Malir & Korangi",
		salesman: "Sarfraz Ahmed",
		type: "Wholesale Dealer",
		paymentMethod: "Credit / Khata",
		openingBalance: 28000,
		currentBalance: 54200,
		creditLimit: 100000,
	},
	{
		id: "CUST-004",
		name: "M Talha (Wholesale Dealer)",
		phone: "0300-1234567",
		city: "Karachi",
		route: "Saddar Auto Market",
		salesman: "Tariq Mehmood",
		type: "Wholesale Dealer",
		paymentMethod: "Credit / Khata",
		openingBalance: 50000,
		currentBalance: 42500,
		creditLimit: 200000,
	},
	{
		id: "CUST-005",
		name: "Sufiyan Autos Gulshan",
		phone: "0313-7766554",
		city: "Karachi",
		route: "Gulshan-e-Iqbal",
		salesman: "Kashif Raza",
		type: "Wholesale Dealer",
		paymentMethod: "Credit / Khata",
		openingBalance: 15000,
		currentBalance: 31400,
		creditLimit: 80000,
	},
	{
		id: "CUST-006",
		name: "Madina Autos Liaquatabad",
		phone: "0345-3344556",
		city: "Karachi",
		route: "Nazimabad / Liaquatabad",
		salesman: "Sarfraz Ahmed",
		type: "Wholesale Dealer",
		paymentMethod: "Credit / Khata",
		openingBalance: 60000,
		currentBalance: 112000,
		creditLimit: 250000,
	},
	{
		id: "CUST-007",
		name: "Naweed Autos Hyderabad",
		phone: "0301-4455667",
		city: "Hyderabad",
		route: "Interior Sindh Route",
		salesman: "Tariq Mehmood",
		type: "Wholesale Dealer",
		paymentMethod: "Credit / Khata",
		openingBalance: 120000,
		currentBalance: 195000,
		creditLimit: 300000,
	},
	{
		id: "CUST-008",
		name: "Taj Autos Quetta",
		phone: "0334-9988771",
		city: "Quetta",
		route: "Baluchistan Route",
		salesman: "Sarfraz Ahmed",
		type: "Wholesale Dealer",
		paymentMethod: "Credit / Khata",
		openingBalance: 85000,
		currentBalance: 148000,
		creditLimit: 300000,
	},
	{
		id: "CUST-009",
		name: "Afraz Auto Works (Workshop)",
		phone: "0333-1285556",
		city: "Karachi",
		route: "Gulshan-e-Iqbal",
		salesman: "Kashif Raza",
		type: "Workshop / Mechanic",
		paymentMethod: "Cash on Counter",
		openingBalance: 0,
		currentBalance: 6400,
		creditLimit: 30000,
	},
	{
		id: "CUST-010",
		name: "Bilal Motorcycle Service",
		phone: "0312-9843210",
		city: "Karachi",
		route: "Saddar Auto Market",
		salesman: "Tariq Mehmood",
		type: "Workshop / Mechanic",
		paymentMethod: "Online Transfer",
		openingBalance: 5000,
		currentBalance: 12800,
		creditLimit: 50000,
	},
];

export const COMMON_COUNTER_ITEMS = [
	{
		name: "Crown QINGQI Piston Kit",
		bikeModel: "Honda CD70",
		category: "Engine & Transmission",
		retailPrice: 1650,
		wholesalePrice: 1450,
		unit: "Kit",
	},
	{
		name: "Crown Clutch Gear Big OEM",
		bikeModel: "Honda CD70",
		category: "Engine & Transmission",
		retailPrice: 1250,
		wholesalePrice: 1120,
		unit: "Pcs",
	},
	{
		name: "Crown Rear Wheel Sleeve",
		bikeModel: "Honda CD70",
		category: "Tyres & Wheels",
		retailPrice: 95,
		wholesalePrice: 78,
		unit: "Pcs",
	},
	{
		name: "Crown 420 Heavy Drive Chain",
		bikeModel: "Honda CD70",
		category: "Chassis & Body",
		retailPrice: 920,
		wholesalePrice: 805,
		unit: "Pcs",
	},
	{
		name: "Crown CD70 Front Brake Shoe",
		bikeModel: "Honda CD70",
		category: "Brakes & Suspension",
		retailPrice: 380,
		wholesalePrice: 310,
		unit: "Sets",
	},
	{
		name: "Crown Clutch Friction Plates",
		bikeModel: "Honda CG125",
		category: "Engine & Transmission",
		retailPrice: 1150,
		wholesalePrice: 980,
		unit: "Sets",
	},
	{
		name: "Crown CG125 Head Light Unit",
		bikeModel: "Honda CG125",
		category: "Electrical & Lighting",
		retailPrice: 890,
		wholesalePrice: 750,
		unit: "Pcs",
	},
	{
		name: "Crown NGK Spark Plug C7HSA",
		bikeModel: "Crown 70cc / Universal",
		category: "Electrical & Lighting",
		retailPrice: 280,
		wholesalePrice: 220,
		unit: "Pcs",
	},
];
