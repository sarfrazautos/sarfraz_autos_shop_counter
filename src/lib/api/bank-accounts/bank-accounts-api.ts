export interface BankAccountItem {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  branchName?: string | null;
  iban?: string | null;
  isActive: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchBankAccounts(activeOnly = false): Promise<{ success: boolean; data: BankAccountItem[] }> {
  const url = activeOnly ? '/api/bank-accounts?activeOnly=true' : '/api/bank-accounts';
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch bank accounts');
  }

  return res.json();
}

export async function createBankAccount(data: Partial<BankAccountItem>): Promise<{ success: boolean; data: BankAccountItem; message?: string }> {
  const res = await fetch('/api/bank-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create bank account');
  }

  return res.json();
}

export async function updateBankAccount(data: Partial<BankAccountItem> & { id: string }): Promise<{ success: boolean; message?: string }> {
  const res = await fetch('/api/bank-accounts', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update bank account');
  }

  return res.json();
}

export async function deleteBankAccount(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/bank-accounts?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete bank account');
  }

  return res.json();
}
