import { adminFetch, buildQuery } from '@/services/api/admin-client';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function fetchAdminSettlements() {
  const res = await adminFetch<ApiResponse<import('@/types/settlement').AdminSettlementsOverview>>(
    '/api/admin/settlements',
  );
  return res.data;
}

export async function fetchAdminPayoutRequests(params: { status?: string; page?: number } = {}) {
  const res = await adminFetch<
    ApiResponse<{
      payoutRequests: import('@/types/settlement').AdminPayoutRequest[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>
  >(`/api/admin/payout-requests${buildQuery(params)}`);
  return res.data;
}

export async function approvePayoutRequest(id: string) {
  const res = await adminFetch<ApiResponse<{ id: string; status: string }>>(
    `/api/admin/payout-requests/${id}/approve`,
    { method: 'POST' },
  );
  return res.data;
}

export async function rejectPayoutRequest(id: string, reason: string) {
  const res = await adminFetch<ApiResponse<{ id: string; status: string }>>(
    `/api/admin/payout-requests/${id}/reject`,
    { method: 'POST', body: JSON.stringify({ reason }) },
  );
  return res.data;
}

export async function processPayoutRequest(id: string) {
  const res = await adminFetch<ApiResponse<{ id: string; status: string; referenceId: string }>>(
    `/api/admin/payout-requests/${id}/process`,
    { method: 'POST' },
  );
  return res.data;
}
