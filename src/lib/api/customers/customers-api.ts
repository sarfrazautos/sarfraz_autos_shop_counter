import type { CustomerProfile } from '@/components/Counter/types';

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  city: string;
  route: string;
  salesman: string;
  customerType: string;
  paymentMethod: string;
  openingBalance: number;
  currentBalance: number;
  creditLimit: number;
  lastPaymentDate: string | null;
  createdAt: string;
}

export interface CustomersResponse {
  success: boolean;
  data: CustomerItem[];
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

export interface FetchCustomersParams {
  page?: number;
  search?: string;
  route?: string;
  type?: string;
}

export async function fetchCustomers(params: FetchCustomersParams = {}): Promise<CustomersResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.search) query.set('search', params.search);
  if (params.route && params.route !== 'all') query.set('route', params.route);
  if (params.type && params.type !== 'all') query.set('type', params.type);

  const res = await fetch(`/api/customers?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch customers');
  }

  return res.json();
}

export async function fetchCustomerById(id: string): Promise<{ success: boolean; data: CustomerItem & { recentTransactions: any[] } }> {
  const res = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch customer');
  }

  return res.json();
}

export async function createCustomer(payload: any): Promise<{ success: boolean; data: any; message?: string }> {
  const res = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to register customer');
  }

  return res.json();
}

export async function updateCustomer(id: string, payload: any): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update customer');
  }

  return res.json();
}

export async function deleteCustomer(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete customer');
  }

  return res.json();
}
