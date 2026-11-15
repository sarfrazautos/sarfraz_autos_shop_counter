export interface SystemHealthData {
  database: {
    status: 'healthy' | 'unhealthy';
    provider: string;
    latencyMs: number;
    branch: string;
    tablesCount: number;
    bytes: number;
    usedMb: number;
    limitMb: number;
    availableMb: number;
    percentUsed: number;
    usedFormatted: string;
    limitFormatted: string;
    availableFormatted: string;
  };
  media: {
    status: 'healthy' | 'unhealthy';
    provider: string;
    storeId: string;
    bytes: number;
    usedMb: number;
    limitMb: number;
    availableMb: number;
    percentUsed: number;
    usedFormatted: string;
    limitFormatted: string;
    availableFormatted: string;
    filesCount: number;
  };
  counts: {
    products: number;
    orders: number;
    customers: number;
  };
  branchNodes: Array<{
    id: string;
    branchId: string;
    counterName: string;
    ipAddress: string;
    pingLatency: string;
    status: string;
    lastSync: string;
    syncHealth: string;
  }>;
  timestamp: string;
}

export async function fetchSystemHealth(): Promise<{ success: boolean; data: SystemHealthData; error?: string }> {
  const res = await fetch('/api/system-health', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch system health');
  }

  const json = await res.json();
  return {
    success: json.success,
    data: json,
  };
}
