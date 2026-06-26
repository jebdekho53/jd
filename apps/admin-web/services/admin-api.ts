/**
 * Centralized admin API layer.
 * UI → hooks → admin-api → /app/api/admin/* BFF → /api/v1/admin/*
 */
import { adminFetch, buildQuery } from '@/services/api/admin-client';
import type {
  ApiResponse,
  AuthUser,
  AdminSession,
  AdminSettings,
  LoginStats,
  PaginatedResponse,
  PaginationMeta,
  RequestOtpResult,
  LoginResult,
  VerifyOtpResult,
} from '@/types/admin';
import type {
  AdminStoreDetail,
  AdminStoreListItem,
  ListStoresParams,
  RejectStorePayload,
  RequestDocumentsPayload,
  RevokeRejectionPayload,
  RemoveBlacklistPayload,
  SuspendStorePayload,
} from '@/types/store';
import type { AdminOrderListItem, ListOrdersParams, RiderQueueOrder, AvailableRider, AssignRiderResult } from '@/types/order';
import type { OrderDetail } from '@/types/order-detail';
import type { AdminUserListItem, ListUsersParams, SuspendUserPayload } from '@/types/user';
import type {
  AdminCategoryRequest,
  GlobalCategory,
  MerchantCategoryStatus,
  StoreCategoryRequestStatus,
} from '@/types/category-governance';
import type {
  ImportLocationsResult,
  ListMasterLocationsParams,
  MasterLocationFilters,
  MasterLocationListResult,
  MasterLocationStats,
} from '@/types/location-directory';

// ─── Auth (BFF: /api/auth/*) ─────────────────────────────────────────────────

export async function loginWithPassword(payload: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<LoginResult> {
  const res = await adminFetch<ApiResponse<LoginResult>>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await adminFetch<ApiResponse<{ message: string }>>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return res.data;
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const res = await adminFetch<ApiResponse<{ message: string }>>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
  return res.data;
}

export async function fetchLoginStats(): Promise<LoginStats> {
  const res = await adminFetch<ApiResponse<LoginStats>>('/api/auth/login-stats');
  return res.data;
}

export async function fetchAdminSettings(): Promise<AdminSettings> {
  const res = await adminFetch<ApiResponse<AdminSettings>>('/api/auth/settings');
  return res.data;
}

export async function updateAdminSettings(
  payload: Partial<Pick<AdminSettings, 'name' | 'email' | 'phone'>>,
): Promise<AdminSettings> {
  const res = await adminFetch<ApiResponse<AdminSettings>>('/api/auth/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await adminFetch<ApiResponse<{ message: string }>>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res.data;
}

export async function listAdminSessions(): Promise<AdminSession[]> {
  const res = await adminFetch<ApiResponse<AdminSession[]>>('/api/auth/sessions');
  return res.data;
}

export async function revokeAdminSession(sessionId: string): Promise<void> {
  await adminFetch<ApiResponse<unknown>>(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function logoutAllDevices(): Promise<void> {
  await adminFetch<ApiResponse<unknown>>('/api/auth/logout-all', { method: 'POST', body: '{}' });
}

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

export async function requestDocuments(
  id: string,
  payload: RequestDocumentsPayload,
): Promise<AdminStoreDetail> {
  const res = await adminFetch<ApiResponse<AdminStoreDetail>>(
    `/api/admin/stores/${id}/request-documents`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return res.data;
}

export async function revokeRejection(
  id: string,
  payload: RevokeRejectionPayload,
): Promise<AdminStoreDetail> {
  const res = await adminFetch<ApiResponse<AdminStoreDetail>>(
    `/api/admin/stores/${id}/revoke-rejection`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function removeBlacklist(
  merchantProfileId: string,
  payload: RemoveBlacklistPayload,
): Promise<{ merchantProfileId: string; isBlacklisted: boolean; reopenedStoreId?: string }> {
  const res = await adminFetch<
    ApiResponse<{ merchantProfileId: string; isBlacklisted: boolean; reopenedStoreId?: string }>
  >(`/api/admin/merchants/${merchantProfileId}/remove-blacklist`, {
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

export async function reinstateStore(id: string): Promise<AdminStoreDetail> {
  const res = await adminFetch<ApiResponse<AdminStoreDetail>>(`/api/admin/stores/${id}/reinstate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return res.data;
}

export async function deleteStore(id: string, payload: SuspendStorePayload): Promise<AdminStoreDetail> {
  const res = await adminFetch<ApiResponse<AdminStoreDetail>>(`/api/admin/stores/${id}/delete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

// ─── Merchant applications (BFF: /api/admin/merchant-applications/*) ─────────

export async function listMerchantApplications(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  const res = await adminFetch<ApiResponse<{ applications: unknown[]; total: number }>>(
    `/api/admin/merchant-applications${buildQuery(params)}`,
  );
  return res.data;
}

export async function getMerchantApplication(id: string) {
  const res = await adminFetch<ApiResponse<unknown>>(`/api/admin/merchant-applications/${id}`);
  return res.data;
}

export async function approveMerchantApplication(id: string) {
  const res = await adminFetch<ApiResponse<unknown>>(`/api/admin/merchant-applications/${id}/approve`, {
    method: 'POST',
  });
  return res.data;
}

export async function rejectMerchantApplication(id: string, reason: string) {
  const res = await adminFetch<ApiResponse<unknown>>(`/api/admin/merchant-applications/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

// ─── Category governance (BFF: /api/admin/categories/*) ─────────────────────

export async function listCategoryRequests(
  params: { status?: StoreCategoryRequestStatus; page?: number; limit?: number; storeId?: string } = {},
): Promise<{ data: AdminCategoryRequest[]; meta: PaginationMeta }> {
  const res = await adminFetch<PaginatedResponse<AdminCategoryRequest[]>>(
    `/api/admin/category-requests${buildQuery(params)}`,
  );
  return { data: res.data, meta: res.meta };
}

export async function getCategoryRequest(id: string): Promise<AdminCategoryRequest> {
  const res = await adminFetch<ApiResponse<AdminCategoryRequest>>(`/api/admin/category-requests/${id}`);
  return res.data;
}

export async function approveCategoryRequest(id: string): Promise<AdminCategoryRequest> {
  const res = await adminFetch<ApiResponse<AdminCategoryRequest>>(
    `/api/admin/category-requests/${id}/approve`,
    { method: 'POST', body: JSON.stringify({}) },
  );
  return res.data;
}

export async function rejectCategoryRequest(
  id: string,
  payload: { reason: string },
): Promise<AdminCategoryRequest> {
  const res = await adminFetch<ApiResponse<AdminCategoryRequest>>(
    `/api/admin/category-requests/${id}/reject`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function requestCategoryDocuments(
  id: string,
  payload: RequestDocumentsPayload,
): Promise<AdminCategoryRequest> {
  const res = await adminFetch<ApiResponse<AdminCategoryRequest>>(
    `/api/admin/category-requests/${id}/request-documents`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function revokeCategoryRejection(
  id: string,
  payload: { reason: string },
): Promise<AdminCategoryRequest> {
  const res = await adminFetch<ApiResponse<AdminCategoryRequest>>(
    `/api/admin/category-requests/${id}/revoke-rejection`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function listGlobalCategories(): Promise<GlobalCategory[]> {
  const res = await adminFetch<ApiResponse<GlobalCategory[]>>('/api/admin/categories');
  return res.data;
}

export interface CreateGlobalCategoryPayload {
  name: string;
  parentId?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface UpdateGlobalCategoryPayload {
  name?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export async function createGlobalCategory(
  payload: CreateGlobalCategoryPayload,
): Promise<GlobalCategory> {
  const res = await adminFetch<ApiResponse<GlobalCategory>>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateGlobalCategory(
  id: string,
  payload: UpdateGlobalCategoryPayload,
): Promise<GlobalCategory> {
  const res = await adminFetch<ApiResponse<GlobalCategory>>(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteGlobalCategory(
  id: string,
): Promise<{ id: string; deletedAt: string; cascadedCount: number }> {
  const res = await adminFetch<
    ApiResponse<{ id: string; deletedAt: string; cascadedCount: number }>
  >(`/api/admin/categories/${id}`, { method: 'DELETE' });
  return res.data;
}

// ─── Orders (BFF: /api/admin/orders/*) ─────────────────────────────────────

export async function listOrders(
  params: ListOrdersParams = {},
): Promise<{ data: AdminOrderListItem[]; meta: PaginationMeta }> {
  const res = await adminFetch<
    ApiResponse<{ orders: AdminOrderListItem[]; meta: PaginationMeta }>
  >(`/api/admin/orders${buildQuery(params)}`);
  return { data: res.data.orders, meta: res.data.meta };
}

export async function getOrder(id: string): Promise<AdminOrderListItem> {
  const res = await adminFetch<ApiResponse<AdminOrderListItem>>(`/api/admin/orders/${id}`);
  return res.data;
}

export async function getOrderDetail(id: string): Promise<OrderDetail> {
  const res = await adminFetch<ApiResponse<OrderDetail>>(`/api/admin/orders/${id}`);
  return res.data;
}

// ─── Rider assignment (BFF: /api/admin/rider-queue, orders/*/assign-rider) ───

export async function listRiderQueue(
  params: { page?: number; limit?: number } = {},
): Promise<{ data: RiderQueueOrder[]; meta: PaginationMeta }> {
  const res = await adminFetch<PaginatedResponse<RiderQueueOrder[]>>(
    `/api/admin/rider-queue${buildQuery(params)}`,
  );
  return { data: res.data, meta: res.meta! };
}

export async function listAvailableRiders(storeId: string): Promise<AvailableRider[]> {
  const res = await adminFetch<ApiResponse<AvailableRider[]>>(
    `/api/admin/riders/available${buildQuery({ storeId })}`,
  );
  return res.data;
}

export async function assignRider(orderId: string, riderProfileId: string): Promise<AssignRiderResult> {
  const res = await adminFetch<ApiResponse<AssignRiderResult>>(
    `/api/admin/orders/${orderId}/assign-rider`,
    { method: 'POST', body: JSON.stringify({ riderProfileId }) },
  );
  return res.data;
}

export async function autoAssignRider(orderId: string): Promise<AssignRiderResult | null> {
  const res = await adminFetch<ApiResponse<AssignRiderResult | null>>(
    `/api/admin/orders/${orderId}/auto-assign`,
    { method: 'POST', body: JSON.stringify({}) },
  );
  return res.data;
}

export async function reassignRider(orderId: string, riderProfileId: string): Promise<AssignRiderResult> {
  const res = await adminFetch<ApiResponse<AssignRiderResult>>(
    `/api/admin/orders/${orderId}/reassign-rider`,
    { method: 'POST', body: JSON.stringify({ riderProfileId }) },
  );
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

// ─── Reviews (BFF: /api/admin/reviews/*) ───────────────────────────────────

export interface AdminReviewListItem {
  id: string;
  rating: number;
  title: string | null;
  review: string | null;
  status: string;
  reportReason: string | null;
  createdAt: string;
  store: { id: string; name: string; slug: string } | null;
  buyer: { name: string } | null;
}

export interface PlatformReviewAnalytics {
  platformRating: number;
  totalReviews: number;
  distribution: Record<string, number>;
  bestRatedStores: { id: string; name: string; slug: string; ratingAvg: number; ratingCount: number }[];
  worstRatedStores: { id: string; name: string; slug: string; ratingAvg: number; ratingCount: number }[];
}

export async function listReviews(params?: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: AdminReviewListItem[]; meta?: { total: number } }> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.search) qs.set('search', params.search);
  const suffix = qs.size ? `?${qs.toString()}` : '';
  const res = await adminFetch<ApiResponse<AdminReviewListItem[]>>(`/api/admin/reviews${suffix}`);
  return { data: res.data, meta: res.meta as { total: number } | undefined };
}

export async function getReviewAnalytics(): Promise<PlatformReviewAnalytics> {
  const res = await adminFetch<ApiResponse<PlatformReviewAnalytics>>('/api/admin/reviews/analytics');
  return res.data;
}

// ─── Promotions (BFF: /api/admin/promotions/*) ─────────────────────────────

export interface AdminPromotionListItem {
  id: string;
  name: string;
  offerType: string;
  usedCount: number;
  isActive: boolean;
  store?: { id: string; name: string; slug: string } | null;
}

export interface AdminCouponListItem {
  id: string;
  code: string;
  name: string;
  usedCount: number;
  isActive: boolean;
  store?: { id: string; name: string; slug: string } | null;
}

export async function listPromotions(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ promotions: AdminPromotionListItem[]; coupons: AdminCouponListItem[] }> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const suffix = qs.size ? `?${qs.toString()}` : '';
  const res = await adminFetch<ApiResponse<{ promotions: AdminPromotionListItem[]; coupons: AdminCouponListItem[] }>>(
    `/api/admin/promotions${suffix}`,
  );
  return res.data;
}

export async function suspendCoupon(id: string) {
  const res = await adminFetch<ApiResponse<AdminCouponListItem>>(
    `/api/admin/promotions/coupons/${id}/suspend`,
    { method: 'POST', body: '{}' },
  );
  return res.data;
}

export async function createPlatformCampaign(payload: Record<string, unknown>) {
  const res = await adminFetch<ApiResponse<AdminCouponListItem>>('/api/admin/promotions/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function moderateReview(
  id: string,
  action: 'approve' | 'hide' | 'restore' | 'remove',
  reason?: string,
): Promise<AdminReviewListItem> {
  const res = await adminFetch<ApiResponse<AdminReviewListItem>>(
    `/api/admin/reviews/${id}/${action}`,
    {
      method: 'POST',
      body: JSON.stringify(reason ? { reason } : {}),
    },
  );
  return res.data;
}

// ─── Master Location Directory ─────────────────────────────────────────────────

export async function listMasterLocations(
  params: ListMasterLocationsParams = {},
): Promise<MasterLocationListResult> {
  const res = await adminFetch<ApiResponse<MasterLocationListResult>>(
    `/api/admin/locations${buildQuery(params)}`,
  );
  return res.data;
}

export async function getMasterLocationStats(): Promise<MasterLocationStats> {
  const res = await adminFetch<ApiResponse<MasterLocationStats>>('/api/admin/locations/stats');
  return res.data;
}

export async function getMasterLocationFilters(): Promise<MasterLocationFilters> {
  const res = await adminFetch<ApiResponse<MasterLocationFilters>>('/api/admin/locations/filters');
  return res.data;
}

export async function setMasterLocationActive(id: string, isActive: boolean) {
  const res = await adminFetch<ApiResponse<unknown>>(`/api/admin/locations/pincodes/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  return res.data;
}

export async function importMasterLocations(csv: string): Promise<ImportLocationsResult> {
  const res = await adminFetch<ApiResponse<ImportLocationsResult>>('/api/admin/locations/import', {
    method: 'POST',
    body: JSON.stringify({ csv }),
  });
  return res.data;
}

export function exportMasterLocations(): void {
  window.location.href = '/api/admin/locations/export';
}

// ─── Media coverage ───────────────────────────────────────────────────────────

export interface MediaCoverageReport {
  totals: {
    productsWithoutImages: number;
    storesWithoutLogo: number;
    storesWithoutBanner: number;
    categoriesWithoutImages: number;
  };
  samples: {
    products: {
      id: string;
      name: string;
      storeId: string;
      isActive: boolean;
      store: { name: string };
    }[];
    storesMissingLogo: { id: string; name: string; status: string }[];
    storesMissingBanner: { id: string; name: string; status: string }[];
    categories: {
      id: string;
      name: string;
      parentId: string | null;
      isActive: boolean;
      parent: { name: string } | null;
    }[];
  };
}

export async function fetchMediaCoverage(): Promise<MediaCoverageReport> {
  const res = await adminFetch<ApiResponse<MediaCoverageReport>>('/api/admin/media/image-coverage');
  return res.data;
}
