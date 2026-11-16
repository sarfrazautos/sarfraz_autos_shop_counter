export interface VendorProfile {
	id: string;
	name: string;
	contactPerson?: string;
	phone: string;
	email?: string;
	city: string;
	address?: string;
	openingBalance: number;
	currentBalance: number;
	status: string;
	createdAt?: string | Date;
}

export interface VendorTransaction {
	id: string;
	purchaseId?: string | null;
	transactionType: "BILL" | "PAYMENT" | "ADJUSTMENT" | string;
	amount: number;
	balanceAfter: number;
	paymentMode: string;
	referenceNumber?: string | null;
	proofAttachmentUrl?: string | null;
	description: string;
	transactionDate: string | Date;
	createdAt?: string | Date;
}
