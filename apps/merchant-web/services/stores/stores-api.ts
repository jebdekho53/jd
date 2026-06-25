import { merchantFetch } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';
import type { Store, CreateStorePayload, UpdateStorePayload, UploadVerificationDocumentPayload } from '@/types/store';

interface StoreListResponse {
  data: Store[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function listStores(page = 1): Promise<StoreListResponse> {
  return merchantFetch<StoreListResponse>(`/api/merchant/stores?page=${page}&limit=50`);
}

export async function getStore(id: string): Promise<Store> {
  const res = await merchantFetch<ApiResponse<Store>>(`/api/merchant/stores/${id}`);
  return res.data;
}

export async function createStore(payload: CreateStorePayload): Promise<Store> {
  const res = await merchantFetch<ApiResponse<Store>>('/api/merchant/stores', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateStore(id: string, payload: UpdateStorePayload): Promise<Store> {
  const res = await merchantFetch<ApiResponse<Store>>(`/api/merchant/stores/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function submitStoreForReview(id: string): Promise<Store> {
  const res = await merchantFetch<ApiResponse<Store>>(
    `/api/merchant/stores/${id}/submit-review`,
    { method: 'POST', body: '{}' },
  );
  return res.data;
}

export async function uploadVerificationDocument(
  storeId: string,
  payload: UploadVerificationDocumentPayload,
): Promise<Store> {
  const res = await merchantFetch<ApiResponse<Store>>(
    `/api/merchant/stores/${storeId}/documents`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function submitDocumentsForReview(storeId: string): Promise<Store> {
  const res = await merchantFetch<ApiResponse<Store>>(
    `/api/merchant/stores/${storeId}/submit-documents`,
    { method: 'POST', body: '{}' },
  );
  return res.data;
}
