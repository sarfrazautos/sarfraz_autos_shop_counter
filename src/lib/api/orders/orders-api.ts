import type { OrderRecord, OrderStatus, OrderType } from '@/components/Orders/types';

export interface OrdersResponse {
  success: boolean;
  data: OrderRecord[];
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

export interface FetchOrdersParams {
  page?: number;
  search?: string;
  status?: string;
  branchId?: string;
  type?: string;
}

export async function fetchOrders(params: FetchOrdersParams = {}): Promise<OrdersResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.branchId && params.branchId !== 'all') query.set('branchId', params.branchId);
  if (params.type && params.type !== 'all') query.set('type', params.type);

  const res = await fetch(`/api/orders?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch orders');
  }

  return res.json();
}

export async function fetchOrderById(id: string): Promise<{ success: boolean; data: any }> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch order');
  }

  return res.json();
}

export async function createOrder(payload: any): Promise<{
  success: boolean;
  data: { orderId: string; invoiceNumber: string; totalAmount: number };
  message?: string;
}> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate order invoice');
  }

  return res.json();
}

export async function updateOrder(
  id: string,
  payload: any
): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update order');
  }

  return res.json();
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  remarks?: string
): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, remarks }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update order status');
  }

  return res.json();
}

export async function cancelOrder(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to cancel order');
  }

  return res.json();
}
