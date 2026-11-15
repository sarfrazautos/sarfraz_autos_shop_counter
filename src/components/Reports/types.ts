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

export const INITIAL_AGING_DATA: CustomerAgingRow[] = [];

export const AGING_ROUTES: string[] = [
	"All Routes",
	"Saddar Auto Market",
	"Gulshan-e-Iqbal",
	"Malir & Korangi",
	"Nazimabad / Liaquatabad",
	"Interior Sindh Route",
	"Baluchistan Route",
];

export const AGING_SALESMEN: string[] = [
	"All Collectors",
	"Tariq Mehmood",
	"Sarfraz Ahmed",
	"Kashif Raza",
];
