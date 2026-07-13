'use client';

/** Thin client for the rider BFF routes (all under /api). */

async function jfetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T; message?: string };
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return (json.data ?? (json as unknown as T)) as T;
}

export type RiderStatus = 'OFFLINE' | 'ONLINE' | 'BUSY' | 'ON_DELIVERY';

export interface RiderMe {
  user: { id: string; phone: string; roles: string[] };
  profile: {
    id: string;
    displayName: string;
    status: RiderStatus;
    kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    vehicleType: string | null;
    isVerified: boolean;
  };
}

export interface RiderOrder {
  deliveryId: string;
  orderId: string;
  orderNumber: string;
  deliveryStatus: string;
  storeName: string;
  storeLat: number;
  storeLng: number;
  customerLat: number;
  customerLng: number;
  customerArea: string;
  totalAmount: number;
  paymentMethod: string;
  assignedAt: string;
  riderEarning: number | null;
}

export interface RiderOrderDetail extends RiderOrder {
  storePhone: string | null;
  storeAddress: string;
  deliveryAddress: Record<string, string>;
  buyerNote: string | null;
  distanceKm: number | null;
  estimatedMins: number | null;
  items: { name: string; variant: string; quantity: number }[];
  timeline: { status: string; at: string }[];
}

export interface TodayEarnings {
  deliveries: number;
  /** Total rider earning today (₹). BFF returns this as `amount`. */
  amount: number;
}

/** Normalise a 10-digit Indian mobile to E.164 (+91XXXXXXXXXX) for the API. */
export function toE164(input: string): string {
  const digits = (input ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  return `+${digits}`;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const requestOtp = (phone: string) =>
  jfetch<{ message: string; expiresIn: number }>('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: toE164(phone) }),
  });

export const verifyOtp = (phone: string, code: string) =>
  jfetch<{ user: { id: string; phone: string; roles: string[] } }>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: toE164(phone), code }),
  });

export const logout = () => jfetch('/api/auth/logout', { method: 'POST' });

// ── Rider ────────────────────────────────────────────────────────────────────
export const getMe = () => jfetch<RiderMe>('/api/rider/me');

export const setStatus = (status: RiderStatus) =>
  jfetch<{ status: RiderStatus }>('/api/rider/status', {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const listOrders = () => jfetch<RiderOrder[]>('/api/rider/orders');
export const getOrder = (id: string) => jfetch<RiderOrderDetail>(`/api/rider/orders/${id}`);
export const getTodayEarnings = () => jfetch<TodayEarnings>('/api/rider/earnings/today');

const action = (id: string, verb: string, body?: unknown) =>
  jfetch<RiderOrder>(`/api/rider/orders/${id}/${verb}`, {
    method: 'PATCH',
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

export const acceptOrder = (id: string) => action(id, 'accept');
export const rejectOrder = (id: string, reason: string) => action(id, 'reject', { reason });
export const arrivedStore = (id: string) => action(id, 'arrived-store');
export const pickedUp = (id: string) => action(id, 'picked-up');
export const arrivedCustomer = (id: string) => action(id, 'arrived-customer');
export const markDelivered = (id: string) => action(id, 'delivered');
export const markFailed = (id: string, reason: string) => action(id, 'failed', { reason });

export const pushLocation = (lat: number, lng: number) =>
  jfetch('/api/rider/location', { method: 'PATCH', body: JSON.stringify({ lat, lng }) });
