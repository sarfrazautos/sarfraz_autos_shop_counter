import type { CustomerLedgerAccount, LedgerTransaction } from '@/components/Ledger/types';

export interface LedgerAccountsResponse {
  success: boolean;
  data: {
    accounts: CustomerLedgerAccount[];
    selectedCustomerId: string;
    transactions: LedgerTransaction[];
  };
  error?: string;
}

export interface CustomerLedgerResponse {
  success: boolean;
  customer: {
    id: string;
    name: string;
    phone: string;
    city: string;
    route: string;
    salesman: string;
    currentBalance: number;
    creditLimit: number;
  };
  data: LedgerTransaction[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  error?: string;
}

export async function fetchLedgerAccounts(customerId?: string): Promise<LedgerAccountsResponse> {
  const query = new URLSearchParams();
  if (customerId) query.set('customerId', customerId);

  const res = await fetch(`/api/ledger?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch ledger accounts');
  }

  return res.json();
}

export async function fetchCustomerLedger(
  customerId: string,
  params: { page?: number; type?: string; startDate?: string; endDate?: string } = {}
): Promise<CustomerLedgerResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.type && params.type !== 'all') query.set('type', params.type);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}/ledger?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch customer ledger');
  }

  return res.json();
}

export async function addLedgerTransaction(
  customerId: string,
  payload: {
    transactionType: string;
    amount: number;
    description?: string;
    collectorName?: string;
    paymentMethod?: string;
  }
): Promise<{ success: boolean; data: any; message?: string }> {
  const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}/ledger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to record ledger transaction');
  }

  return res.json();
}
