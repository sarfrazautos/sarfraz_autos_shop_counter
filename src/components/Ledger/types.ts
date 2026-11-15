export interface LedgerTransaction {
	id: string;
	date: string;
	voucherNo: string;
	type: "Sale Invoice" | "Cash Recovery" | "Bank Transfer" | "Return Adjustment" | "Opening Balance";
	description: string;
	debit: number; // Invoiced amounts (increases customer debt)
	credit: number; // Received payments (decreases customer debt)
	balance: number; // Running balance after transaction
	collectorOrCashier?: string;
}

export interface CustomerLedgerAccount {
	id: string;
	name: string;
	customerName?: string;
	phone: string;
	city: string;
	route: string;
	salesman: string;
	openingBalance: number;
	currentBalance: number;
	creditLimit: number;
	lastPaymentDate: string;
	transactions: LedgerTransaction[];
}

export const INITIAL_LEDGER_ACCOUNTS: CustomerLedgerAccount[] = [];
