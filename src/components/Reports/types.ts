export interface CustomerAgingRow {
	id: string;
	customerName: string;
	phone: string;
	city: string;
	route: string;
	salesman: string;
	totalBalance: number;
	bucket0To30: number; // 0 - 30 days
	bucket31To60: number; // 31 - 60 days
	bucket61To90: number; // 61 - 90 days
	bucketAbove90: number; // 90+ days (Overdue)
	lastPaymentDate: string;
	unpaidInvoicesCount: number;
}

export const INITIAL_AGING_DATA: CustomerAgingRow[] = [
	{
		id: "CUST-002",
		customerName: "Dilawar Autos Saddar",
		phone: "0321-2244889",
		city: "Karachi",
		route: "Saddar Auto Market",
		salesman: "Tariq Mehmood",
		totalBalance: 87500,
		bucket0To30: 30050,
		bucket31To60: 42450,
		bucket61To90: 15000,
		bucketAbove90: 0,
		lastPaymentDate: "10 Nov 2026",
		unpaidInvoicesCount: 3,
	},
	{
		id: "CUST-004",
		customerName: "M Talha (Wholesale Dealer)",
		phone: "0300-1234567",
		city: "Karachi",
		route: "Saddar Auto Market",
		salesman: "Tariq Mehmood",
		totalBalance: 42500,
		bucket0To30: 32500,
		bucket31To60: 10000,
		bucket61To90: 0,
		bucketAbove90: 0,
		lastPaymentDate: "12 Nov 2026",
		unpaidInvoicesCount: 2,
	},
	{
		id: "CUST-003",
		customerName: "Ahmed Autos Malir",
		phone: "0333-8899112",
		city: "Karachi",
		route: "Malir & Korangi",
		salesman: "Sarfraz Ahmed",
		totalBalance: 54200,
		bucket0To30: 26200,
		bucket31To60: 28000,
		bucket61To90: 0,
		bucketAbove90: 0,
		lastPaymentDate: "08 Nov 2026",
		unpaidInvoicesCount: 2,
	},
	{
		id: "CUST-005",
		customerName: "Sufiyan Autos Gulshan",
		phone: "0313-7766554",
		city: "Karachi",
		route: "Gulshan-e-Iqbal",
		salesman: "Kashif Raza",
		totalBalance: 31400,
		bucket0To30: 16400,
		bucket31To60: 15000,
		bucket61To90: 0,
		bucketAbove90: 0,
		lastPaymentDate: "05 Nov 2026",
		unpaidInvoicesCount: 1,
	},
	{
		id: "CUST-006",
		customerName: "Madina Autos Liaquatabad",
		phone: "0345-3344556",
		city: "Karachi",
		route: "Nazimabad / Liaquatabad",
		salesman: "Sarfraz Ahmed",
		totalBalance: 112000,
		bucket0To30: 52000,
		bucket31To60: 35000,
		bucket61To90: 25000,
		bucketAbove90: 0,
		lastPaymentDate: "03 Nov 2026",
		unpaidInvoicesCount: 4,
	},
	{
		id: "CUST-007",
		customerName: "Naweed Autos Hyderabad",
		phone: "0301-4455667",
		city: "Hyderabad",
		route: "Interior Sindh Route",
		salesman: "Tariq Mehmood",
		totalBalance: 195000,
		bucket0To30: 75000,
		bucket31To60: 50000,
		bucket61To90: 45000,
		bucketAbove90: 25000,
		lastPaymentDate: "28 Oct 2026",
		unpaidInvoicesCount: 5,
	},
	{
		id: "CUST-008",
		customerName: "Taj Autos Quetta",
		phone: "0334-9988771",
		city: "Quetta",
		route: "Baluchistan Route",
		salesman: "Sarfraz Ahmed",
		totalBalance: 148000,
		bucket0To30: 63000,
		bucket31To60: 45000,
		bucket61To90: 25000,
		bucketAbove90: 15000,
		lastPaymentDate: "25 Oct 2026",
		unpaidInvoicesCount: 4,
	},
	{
		id: "CUST-010",
		customerName: "Bilal Motorcycle Service",
		phone: "0312-9843210",
		city: "Karachi",
		route: "Saddar Auto Market",
		salesman: "Tariq Mehmood",
		totalBalance: 12800,
		bucket0To30: 7800,
		bucket31To60: 5000,
		bucket61To90: 0,
		bucketAbove90: 0,
		lastPaymentDate: "09 Nov 2026",
		unpaidInvoicesCount: 1,
	},
];

export const AGING_ROUTES = [
	"All Routes",
	"Saddar Auto Market",
	"Gulshan-e-Iqbal",
	"Malir & Korangi",
	"Nazimabad / Liaquatabad",
	"Interior Sindh Route",
	"Baluchistan Route",
];

export const AGING_SALESMEN = [
	"All Collectors",
	"Tariq Mehmood",
	"Sarfraz Ahmed",
	"Kashif Raza",
];
