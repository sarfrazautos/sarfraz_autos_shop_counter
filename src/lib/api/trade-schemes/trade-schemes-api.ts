export interface TradeSchemeItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  bikeModel: string;
  title: string;
  type: 'buy_x_get_y' | 'net_rate';
  buyQuantity: number;
  freeQuantity: number;
  regularWholesalePrice: number;
  netSchemeRate: number | null;
  applicableTier: string;
  validFrom: string;
  validTo: string;
  status: 'Active' | 'Paused' | 'Expired';
  remarks: string;
}

export interface TradeSchemesResponse {
  success: boolean;
  data: TradeSchemeItem[];
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

export interface FetchTradeSchemesParams {
  page?: number;
  search?: string;
  status?: string;
  type?: string;
}

export async function fetchTradeSchemes(params: FetchTradeSchemesParams = {}): Promise<TradeSchemesResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.type && params.type !== 'all') query.set('type', params.type);

  const res = await fetch(`/api/trade-schemes?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch trade schemes');
  }

  return res.json();
}

export async function fetchTradeSchemeById(id: string): Promise<{ success: boolean; data: TradeSchemeItem }> {
  const res = await fetch(`/api/trade-schemes/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch trade scheme');
  }

  return res.json();
}

export async function createTradeScheme(payload: any): Promise<{ success: boolean; data: any; message?: string }> {
  const res = await fetch('/api/trade-schemes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create trade scheme');
  }

  return res.json();
}

export async function updateTradeScheme(id: string, payload: any): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/trade-schemes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update trade scheme');
  }

  return res.json();
}

export async function deleteTradeScheme(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/trade-schemes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete trade scheme');
  }

  return res.json();
}
