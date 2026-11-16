export interface PurchaseItem {
	id?: string;
	productId?: string;
	productName: string;
	sku: string;
	bikeModel: string;
	purchaseRate: number;
	quantity: number;
	freeQuantity: number;
	isNetScheme: boolean;
	schemeNote?: string | null;
	lineTotal: number;
}

export interface PurchaseRecord {
	id: string;
	invoiceNumber: string;
	vendorId: string;
	vendorName: string;
	branchId: string;
	branchName?: string;
	branchShortName?: string;
	totalAmount: number;
	paidAmount: number;
	balanceDue: number;
	paymentStatus: "Paid" | "Partial" | "Unpaid" | string;
	billAttachmentUrl?: string | null;
	remarks?: string | null;
	purchaseDate: string | Date;
	createdAt?: string | Date;
	items: PurchaseItem[];
}

export interface LastPurchaseRateInfo {
	hasHistory: boolean;
	lastRate?: number;
	quantity?: number;
	freeQuantity?: number;
	isNetScheme?: boolean;
	schemeNote?: string;
	vendorName?: string;
	invoiceNumber?: string;
	purchaseDate?: string | Date;
}

export interface ExcelImportRow {
	id: string;
	productId?: string;
	productName: string;
	sku: string;
	bikeModel: string;
	purchaseRate: number;
	quantity: number;
	freeQuantity: number;
	isNetScheme: boolean;
	schemeNote?: string;
	lineTotal: number;
}
