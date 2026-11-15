export interface RiderItem {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'idle' | 'en_route_delivery' | 'offline';
  lat: number;
  lng: number;
  activeOrderId: string | null;
  activeInvoiceNumber: string | null;
  destinationName: string | null;
  destinationCity: string | null;
  lastPing: string;
}

export async function fetchRiders(): Promise<{ success: boolean; data: RiderItem[] }> {
  const res = await fetch('/api/riders', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch riders');
  }

  return res.json();
}

export async function addRider(payload: {
  name: string;
  phone: string;
  vehicleNumber: string;
  currentStatus?: string;
  currentLatitude?: number;
  currentLongitude?: number;
}): Promise<{ success: boolean; data: any; message?: string }> {
  const res = await fetch('/api/riders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add delivery rider');
  }

  return res.json();
}

export async function fetchRiderLocationLogs(riderId: string): Promise<{ success: boolean; data: any[] }> {
  const res = await fetch(`/api/riders/${encodeURIComponent(riderId)}/location`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch location logs');
  }

  return res.json();
}

export async function updateRiderLocation(
  riderId: string,
  payload: { latitude: number; longitude: number; speedKmh?: number; status?: string }
): Promise<{ success: boolean; data: any }> {
  const res = await fetch(`/api/riders/${encodeURIComponent(riderId)}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update rider location');
  }

  return res.json();
}
