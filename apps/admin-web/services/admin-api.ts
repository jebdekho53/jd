/**
 * Centralized admin API layer.
 * UI → hooks → admin-api → /app/api/admin/* BFF → /api/v1/admin/*
 */
import { adminFetch, buildQuery } from '@/services/api/admin-client';
import type {
  ApiResponse,
  AuthUser,
  PaginatedResponse,
  PaginationMeta,
  RequestOtpResult,
  VerifyOtpResult,
} from '@/types/admin';
import type {
  AdminStoreDetail,
  AdminStoreListItem,
  ListStoresParams,
  RejectStorePayload,
  SuspendStorePayload,
} from '@/types/store';
import type { AdminOrderListItem, ListOrdersParams } from '@/types/order';
import type { AdminUserListItem, ListUsersParams, SuspendUserPayload } from '@/types/user';

// ─── Auth (BFF: /api/auth/*) ─────────────────────────────────────────────────

export async function requestOtp(phone: string): Promise<RequestOtpResult> {
  const res = await adminFetch<ApiResponse<RequestOtpResult>>('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, deviceName: 'admin-web' }),
  });
  return res.data;
}

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const res = await adminFetch<ApiResponse<VerifyOtpResult>>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code, deviceName: 'admin-web' }),
  });
  return res.data;
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await adminFetch<ApiResponse<AuthUser>>('/api/auth/me');
  return res.data;
}

export async function logoutSession(): Promise<void> {
  await adminFetch<ApiResponse<unknown>>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ─── Stores (BFF: /api/admin/stores/*) ───────────────────────────────────────

export async function listStores(
  params: ListStoresParams = {},
): Promise<{ data: AdminStoreListItem[]; meta: PaginationMeta }> {
  const res = await adminFetch<PaginatedResponse<AdminStoreListItem[]>>(
    `/api/admin/stores${buildQuery(params)}`,
  );
  return { data: res.data, meta: res.meta };
}

export async function getStore(id: string): Promise<AdminStoreDetail> {
  const res = await adminFetch<ApiResponse<AdminStoreDetail>>(`/api/admin/stores/${id}`);
  return res.data;
}

export async function approveStore(id: string): Promise<AdminStoreDetail> {
  const res = await adminFetch<ApiResponse<AdminStoreDetail>>(`/api/admin/stores/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return res.data;
}

export async function rejectStore(id: string, payload: RejectStorePayload): Promise<AdminStoreDetail> {
  const res = await adminFetch<ApiResponse<AdminStoreDetail>>(`/api/admin/stores/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function suspendStore(id: string, payload: SuspendStorePayload): Promise<AdminStoreDetail> {
  const res = await adminFetch<ApiResponse<AdminStoreDetail>>(`/api/admin/stores/${id}/suspend`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

// ─── Orders (BFF: /api/admin/orders/*) ─────────────────────────────────────

export async function listOrders(
  params: ListOrdersParams = {},
): Promise<{ data: AdminOrderListItem[]; meta: PaginationMeta }> {
  const res = await adminFetch<PaginatedResponse<AdminOrderListItem[]>>(
    `/api/admin/orders${buildQuery(params)}`,
  );
  return { data: res.data, meta: res.meta };
}

export async function getOrder(id: string): Promise<AdminOrderListItem> {
  const res = await adminFetch<ApiResponse<AdminOrderListItem>>(`/api/admin/orders/${id}`);
  return res.data;
}

// ─── Users (BFF: /api/admin/users/*) ───────────────────────────────────────

export async function listUsers(
  params: ListUsersParams = {},
): Promise<{ data: AdminUserListItem[]; meta: PaginationMeta }> {
  const res = await adminFetch<PaginatedResponse<AdminUserListItem[]>>(
    `/api/admin/users${buildQuery(params)}`,
  );
  return { data: res.data, meta: res.meta };
}

export async function suspendUser(id: string, payload: SuspendUserPayload): Promise<AdminUserListItem> {
  const res = await adminFetch<ApiResponse<AdminUserListItem>>(`/api/admin/users/${id}/suspend`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

// ─── Monitoring (BFF: /api/admin/metrics/*) ────────────────────────────────

export interface MetricsOverview {
  ordersToday: number;
  ordersThisWeek: number;
  revenueCod: number;
  revenuePrepaid: number;
  activeMerchants: number;
  activeRiders: number;
  pendingStoreApprovals: number;
  failedPayments: number;
}

export interface FraudMetrics {
  failedPayments: unknown[];
  otpAbuse: unknown[];
  orderSpikes: unknown[];
  inventoryMismatches: unknown[];
}

export async function getMetricsOverview(): Promise<MetricsOverview> {
  const res = await adminFetch<ApiResponse<MetricsOverview>>('/api/admin/metrics/overview');
  return res.data;
}

export async function getFraudMetrics(): Promise<FraudMetrics> {
  const res = await adminFetch<ApiResponse<FraudMetrics>>('/api/admin/metrics/fraud');
  return res.data;
}
