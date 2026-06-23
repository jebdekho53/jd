import { getAccessToken, getBffBaseUrl, setTokens } from '@/lib/auth/session';
import { useAuthStore } from '@/store/auth-store';
import { normalizeError, type NormalizedError } from '@/types/errors';
import type {
  ApiResponse,
  RequestOtpResult,
  RiderAvailability,
  RiderMeResponse,
  VerifyOtpResult,
} from '@/types/rider';
import type { LocationUpdatePayload } from '@/types/location';
import type {
  DeliveryAction,
  RiderOrderDetail,
  RiderOrderListItem,
} from '@/types/order';

import { withRequestLock, RequestLockError } from '@/lib/request-lock';
import { checkActionAbuse } from '@/services/anti-fraud';
import { log } from '@/services/logger';

export class RiderApiError extends Error {
  public normalized: NormalizedError;

  constructor(message: string, public status: number, context?: Record<string, unknown>) {
    super(message);
    this.name = 'RiderApiError';
    this.normalized = normalizeError(this, { status, ...context });
  }
}

function errorCode(status: number): string {
  if (status === 0) return 'NETWORK_ERROR';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'VALIDATION_ERROR';
  if (status >= 500) return 'SERVER_ERROR';
  return `HTTP_${status}`;
}

/**
 * All rider API traffic goes through the BFF — never hits NestJS directly.
 */
export async function riderFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getBffBaseUrl();
  const token = await getAccessToken();
  const started = Date.now();

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Client': 'rider-mobile',
        ...init?.headers,
      },
    });
  } catch (err) {
    const normalized = normalizeError(err, { path, method: init?.method ?? 'GET' });
    throw new RiderApiError(normalized.message, 0, { path, normalized });
  }

  const elapsed = Date.now() - started;
  void elapsed;

  if (res.status === 401) {
    useAuthStore.getState().clearSession();
    throw new RiderApiError('Session expired', 401, { path });
  }

  if (res.status === 403) {
    throw new RiderApiError('Access denied', 403, { path });
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const raw = (body as { message?: string | string[] })?.message ?? 'Request failed';
    const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
    const code = (body as { code?: string })?.code ?? errorCode(res.status);
    throw new RiderApiError(message, res.status, { path, code });
  }

  return body as T;
}

export async function postGpsQuality(metric: Record<string, unknown>) {
  await riderFetch<ApiResponse<unknown>>('/api/rider/health/gps-quality', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
}

export function buildQuery(params: object): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') q.set(key, String(val));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function requestOtp(phone: string): Promise<RequestOtpResult> {
  const res = await riderFetch<ApiResponse<RequestOtpResult>>('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, deviceName: 'rider-mobile' }),
  });
  return res.data;
}

interface VerifyOtpBffData extends VerifyOtpResult {
  accessToken?: string;
  refreshToken?: string;
}

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const res = await riderFetch<ApiResponse<VerifyOtpBffData>>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code, deviceName: 'rider-mobile' }),
  });
  if (res.data.accessToken && res.data.refreshToken) {
    await setTokens(res.data.accessToken, res.data.refreshToken);
  }
  return res.data;
}

export async function fetchRiderMe(): Promise<RiderMeResponse> {
  const res = await riderFetch<ApiResponse<RiderMeResponse>>('/api/rider/me');
  return res.data;
}

export async function logoutSession(): Promise<void> {
  await riderFetch<ApiResponse<unknown>>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function updateRiderStatus(status: RiderAvailability): Promise<{ status: RiderAvailability }> {
  const res = await riderFetch<ApiResponse<{ status: RiderAvailability }>>('/api/rider/status', {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}

export async function pushLocation(payload: LocationUpdatePayload): Promise<void> {
  await riderFetch<ApiResponse<unknown>>('/api/rider/location', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function listRiderOrders(): Promise<RiderOrderListItem[]> {
  const res = await riderFetch<ApiResponse<RiderOrderListItem[]>>('/api/rider/orders');
  return res.data;
}

export async function getRiderOrder(orderId: string): Promise<RiderOrderDetail> {
  const res = await riderFetch<ApiResponse<RiderOrderDetail>>(`/api/rider/orders/${orderId}`);
  return res.data;
}

async function patchOrderAction(
  orderId: string,
  action: DeliveryAction,
  body?: Record<string, unknown>,
): Promise<RiderOrderDetail> {
  return withRequestLock(orderId, action, async () => {
    const abuse = checkActionAbuse(orderId, action);
    if (!abuse.allowed) {
      throw new RiderApiError(abuse.reason ?? 'Action blocked', 422, { flags: abuse.flags });
    }

    await riderFetch<ApiResponse<unknown>>(
      `/api/rider/orders/${orderId}/${action}`,
      { method: 'PATCH', body: JSON.stringify(body ?? {}) },
    );

    log('ORDER_STATE_CHANGE', `Order ${action}`, { orderId });
    return getRiderOrder(orderId);
  });
}

export { RequestLockError };

export const acceptOrder = (id: string) => patchOrderAction(id, 'accept');
export const rejectOrder = (id: string, reason?: string) =>
  patchOrderAction(id, 'reject', reason ? { reason } : undefined);
export const arrivedAtStore = (id: string) => patchOrderAction(id, 'arrived-store');
export const pickedUpOrder = (id: string) => patchOrderAction(id, 'picked-up');
export const arrivedAtCustomer = (id: string) => patchOrderAction(id, 'arrived-customer');
export const deliveredOrder = (id: string) => patchOrderAction(id, 'delivered');
export const failedOrder = (id: string, reason: string) =>
  patchOrderAction(id, 'failed', { reason });

export interface RiderEarnings {
  today: number;
  thisWeek: number;
  codTotal: number;
  prepaidTotal: number;
  deliveryCount: number;
}

export interface TodayEarnings {
  amount: number;
  deliveries: number;
}

export interface EarningsHistoryItem {
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentMethod: 'COD' | 'RAZORPAY';
  completedAt: string;
}

export async function getRiderEarnings(): Promise<RiderEarnings> {
  const res = await riderFetch<ApiResponse<RiderEarnings>>('/api/rider/earnings');
  return res.data;
}

export async function getTodayEarnings(): Promise<TodayEarnings> {
  const res = await riderFetch<ApiResponse<TodayEarnings>>('/api/rider/earnings/today');
  return res.data;
}

export async function getEarningsHistory(): Promise<EarningsHistoryItem[]> {
  const res = await riderFetch<ApiResponse<EarningsHistoryItem[]>>('/api/rider/earnings/history');
  return res.data;
}
