import { merchantFetch } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';
import type { CatalogCategory, StoreCategoryRequest } from '@/types/category-governance';

function storeQuery(storeId: string) {
  return `?storeId=${encodeURIComponent(storeId)}`;
}

export async function getCategoryCatalog(storeId: string): Promise<CatalogCategory[]> {
  const res = await merchantFetch<ApiResponse<CatalogCategory[]>>(
    `/api/merchant/categories/catalog${storeQuery(storeId)}`,
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
    `/api/merchant/categories/approved${storeQuery(storeId)}`,
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
