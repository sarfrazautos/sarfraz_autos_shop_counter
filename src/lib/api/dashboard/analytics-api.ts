export interface DashboardAnalyticsData {
  periodDays: number;
  dailyRevenue: { date: string; salesRevenue: number; rawSalesPKR: number }[];
  salesByOrderType: { name: string; share: number; color: string; count: number; total: number }[];
  branchPerformance: { branch: string; sales: number; orders: number }[];
  topBikeModels: { model: string; partsSold: number }[];
  summary: { totalSalesPKR: number; totalOrders: number };
}

export async function fetchDashboardAnalytics(days: number = 30): Promise<{
  success: boolean;
  data: DashboardAnalyticsData;
}> {
  const res = await fetch(`/api/dashboard/analytics?days=${days}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch dashboard analytics');
  }

  return res.json();
}
