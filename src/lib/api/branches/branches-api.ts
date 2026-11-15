import type { BranchInfo } from '@/components/Counter/types';

export async function fetchBranches(): Promise<{ success: boolean; data: BranchInfo[] }> {
  const res = await fetch('/api/branches', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch branches');
  }

  return res.json();
}
