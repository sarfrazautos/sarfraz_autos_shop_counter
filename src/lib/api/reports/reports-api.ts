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
