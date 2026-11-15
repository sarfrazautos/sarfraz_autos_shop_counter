export interface TeamMemberItem {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  branchId: string;
  branchName: string | null;
  avatarUrl: string | null;
  status: string;
  joinedDate: string;
}

export async function fetchTeamMembers(branchId?: string): Promise<{ success: boolean; data: TeamMemberItem[] }> {
  const query = new URLSearchParams();
  if (branchId && branchId !== 'all') query.set('branchId', branchId);

  const res = await fetch(`/api/team?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch team members');
  }

  return res.json();
}

export async function fetchTeamMemberById(id: string): Promise<{ success: boolean; data: TeamMemberItem }> {
  const res = await fetch(`/api/team/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch team member');
  }

  return res.json();
}

export async function createTeamMember(payload: any): Promise<{ success: boolean; data: any; message?: string }> {
  const res = await fetch('/api/team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add team member');
  }

  return res.json();
}

export async function updateTeamMember(id: string, payload: any): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/team/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update team member');
  }

  return res.json();
}

export async function deleteTeamMember(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/team/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete team member');
  }

  return res.json();
}
