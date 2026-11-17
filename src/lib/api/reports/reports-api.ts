import type { CustomerAgingRow } from '@/components/Reports/types';

export interface AgingSummary {
  totalReceivables: number;
  total0To30: number;
  total31To60: number;
  total61To90: number;
  totalAbove90: number;
  totalOverdue: number;
}

export interface AgingReportResponse {
  success: boolean;
  data: CustomerAgingRow[];
  summary: AgingSummary;
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

export interface FetchAgingReportParams {
  page?: number;
  search?: string;
  route?: string;
  salesman?: string;
  minDays?: 'All' | '30+' | '60+' | '90+';
}

export async function fetchAgingReport(params: FetchAgingReportParams = {}): Promise<AgingReportResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.search) query.set('search', params.search);
  if (params.route && params.route !== 'All Routes') query.set('route', params.route);
  if (params.salesman && params.salesman !== 'All Collectors') query.set('salesman', params.salesman);
  if (params.minDays && params.minDays !== 'All') query.set('minDays', params.minDays);

  const res = await fetch(`/api/reports/aging?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch aging report');
  }

  return res.json();
}

export interface TopSellingProductItem {
  rank: number;
  productId: string;
  name: string;
  sku: string;
  brand: string;
  bikeModel: string;
  category: string;
  unitsSold: number;
  totalRevenue: number;
  averageRate: number;
  ordersCount: number;
  currentStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  shareOfUnits: number;
  shareOfRev: number;
}

export interface TopOrderItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  orderType: string;
  orderStatus: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
}

export interface TopSellingSummary {
  totalUnitsSold: number;
  totalRevenue: number;
  distinctProductsCount: number;
  totalInvoicesCount: number;
}

export interface TopSellingReportResponse {
  success: boolean;
  data: {
    filter: {
      timeRange: string;
      sortBy: string;
      category: string;
      bikeModel: string;
      branchId: string;
      limit: number;
    };
    summary: TopSellingSummary;
    highlights: {
      topByVolume: TopSellingProductItem | null;
      topByRevenue: TopSellingProductItem | null;
      topByFrequency: TopSellingProductItem | null;
    };
    topSellingProducts: TopSellingProductItem[];
    topOrders: TopOrderItem[];
    categoryBreakdown: { category: string; totalUnits: number; totalRevenue: number }[];
    bikeModelBreakdown: { bikeModel: string; totalUnits: number; totalRevenue: number }[];
  };
  error?: string;
}

export interface FetchTopSellingParams {
  timeRange?: string;
  sortBy?: 'quantity' | 'revenue' | 'orders';
  category?: string;
  bikeModel?: string;
  branchId?: string;
  search?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export async function fetchTopSellingReport(
  params: FetchTopSellingParams = {}
): Promise<TopSellingReportResponse> {
  const query = new URLSearchParams();
  if (params.timeRange) query.set('timeRange', params.timeRange);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.category && params.category !== 'all' && params.category !== 'All')
    query.set('category', params.category);
  if (params.bikeModel && params.bikeModel !== 'all' && params.bikeModel !== 'All')
    query.set('bikeModel', params.bikeModel);
  if (params.branchId && params.branchId !== 'all' && params.branchId !== 'All')
    query.set('branchId', params.branchId);
  if (params.search) query.set('search', params.search);
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const res = await fetch(`/api/reports/top-selling?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch top-selling report');
  }

  return res.json();
}
