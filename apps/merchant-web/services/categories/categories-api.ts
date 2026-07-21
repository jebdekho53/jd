import { merchantFetch } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';
import type { CatalogCategory, StoreCategoryRequest } from '@/types/category-governance';

function storeQuery(storeId: string, extra?: Record<string, string>) {
  const q = new URLSearchParams({ storeId });
  if (extra) {
    for (const [k, v] of Object.entries(extra)) q.set(k, v);
  }
  return `?${q.toString()}`;
}

export async function getCategoryCatalog(
  storeId: string,
  catalogKind?: 'PRODUCT' | 'MENU',
): Promise<CatalogCategory[]> {
  const res = await merchantFetch<ApiResponse<CatalogCategory[]>>(
    `/api/merchant/categories/catalog${storeQuery(storeId, catalogKind ? { catalogKind } : undefined)}`,
  );
  return res.data;
}

export async function listCategoryRequests(storeId: string): Promise<StoreCategoryRequest[]> {
  const res = await merchantFetch<ApiResponse<StoreCategoryRequest[]>>(
    `/api/merchant/category-requests${storeQuery(storeId)}`,
  );
  return res.data;
}

export async function listApprovedCategories(storeId: string): Promise<CatalogCategory[]> {
  const res = await merchantFetch<ApiResponse<CatalogCategory[]>>(
    `/api/merchant/categories/approved${storeQuery(storeId, { catalogKind: 'PRODUCT' })}`,
  );
  return res.data;
}

export async function listApprovedMenuCategories(storeId: string): Promise<CatalogCategory[]> {
  const res = await merchantFetch<ApiResponse<CatalogCategory[]>>(
    `/api/merchant/stores/${storeId}/menu-categories/approved`,
  );
  return res.data;
}

export async function createCategoryRequest(
  storeId: string,
  payload: { categoryId: string; subcategoryId: string; reason?: string },
): Promise<StoreCategoryRequest> {
  const res = await merchantFetch<ApiResponse<StoreCategoryRequest>>(
    `/api/merchant/stores/${storeId}/category-requests`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

/** @alias createCategoryRequest */
export const requestCategoryAccess = createCategoryRequest;
