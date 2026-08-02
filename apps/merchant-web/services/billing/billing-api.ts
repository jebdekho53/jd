import { merchantFetch } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';
import type {
  CreateOfflineBillPayload,
  ListOfflineBillsResponse,
  OfflineBill,
  OfflineBillCustomer,
} from '@/types/billing';

export async function createOfflineBill(storeId: string, payload: CreateOfflineBillPayload): Promise<OfflineBill> {
  const res = await merchantFetch<ApiResponse<OfflineBill>>(
    `/api/merchant/stores/${storeId}/offline-bills`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function listOfflineBills(
  storeId: string,
  params: { page?: number; limit?: number; customerPhone?: string } = {},
): Promise<ListOfflineBillsResponse> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.customerPhone) q.set('customerPhone', params.customerPhone);
  const qs = q.toString();
  const res = await merchantFetch<ApiResponse<ListOfflineBillsResponse>>(
    `/api/merchant/stores/${storeId}/offline-bills${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}

export async function getOfflineBill(storeId: string, billId: string): Promise<OfflineBill> {
  const res = await merchantFetch<ApiResponse<OfflineBill>>(
    `/api/merchant/stores/${storeId}/offline-bills/${billId}`,
  );
  return res.data;
}

export async function listOfflineBillCustomers(storeId: string): Promise<OfflineBillCustomer[]> {
  const res = await merchantFetch<ApiResponse<OfflineBillCustomer[]>>(
    `/api/merchant/stores/${storeId}/offline-bills/customers`,
  );
  return res.data;
}
