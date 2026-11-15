import type { ProductItem } from '@/components/Products/types';

export interface ProductsResponse {
  success: boolean;
  data: ProductItem[];
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

export interface ProductDetailResponse {
  success: boolean;
  data: ProductItem;
  error?: string;
}

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  all?: boolean;
  search?: string;
  category?: string;
  bikeModel?: string;
  status?: string;
  branchId?: string;
}

export async function fetchProducts(params: FetchProductsParams = {}): Promise<ProductsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.all) query.set('all', 'true');
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.bikeModel && params.bikeModel !== 'all') query.set('bikeModel', params.bikeModel);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.branchId && params.branchId !== 'all') query.set('branchId', params.branchId);

  const res = await fetch(`/api/products?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch products (${res.status})`);
  }

  return res.json();
}

export async function fetchProductById(id: string): Promise<ProductDetailResponse> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch product');
  }

  return res.json();
}

export async function createProduct(payload: Partial<ProductItem>): Promise<{ success: boolean; data: any; message?: string }> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create product');
  }

  return res.json();
}

export async function updateProduct(id: string, payload: Partial<ProductItem>): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update product');
  }

  return res.json();
}

export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete product');
  }

  return res.json();
}

export async function bulkUpdatePrices(updates: Array<{ id: string; newPrice: number; field?: 'wholesale' | 'retail' | 'cost'; reason?: string }>) {
  const res = await fetch('/api/products/price-updater', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to execute bulk price updates');
  }

  return res.json();
}

export async function adjustProductStock(payload: {
  productId: string;
  branchId: string;
  quantityChange?: number;
  newQuantity?: number;
  reason?: string;
}) {
  const res = await fetch('/api/products/stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to adjust stock');
  }

  return res.json();
}
