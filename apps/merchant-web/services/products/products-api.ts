import { merchantFetch } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  UpdateInventoryPayload,
  UpdatePricePayload,
  ListProductsParams,
  Category,
} from '@/types/product';

function buildQuery(params: ListProductsParams): string {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  if (params.categoryId) q.set('categoryId', params.categoryId);
  if (params.isActive !== undefined) q.set('isActive', String(params.isActive));
  const s = q.toString();
  return s ? `?${s}` : '';
}

interface ProductListResponse {
  data: Product[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function listProducts(storeId: string, params: ListProductsParams = {}): Promise<ProductListResponse> {
  return merchantFetch<ProductListResponse>(
    `/api/merchant/stores/${storeId}/products${buildQuery({ limit: 50, ...params })}`,
  );
}

export async function getProduct(storeId: string, productId: string): Promise<Product> {
  const res = await merchantFetch<ApiResponse<Product>>(
    `/api/merchant/stores/${storeId}/products/${productId}`,
  );
  return res.data;
}

export async function createProduct(storeId: string, payload: CreateProductPayload): Promise<Product> {
  const res = await merchantFetch<ApiResponse<Product>>(
    `/api/merchant/stores/${storeId}/products`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function updateProduct(storeId: string, productId: string, payload: UpdateProductPayload): Promise<Product> {
  const res = await merchantFetch<ApiResponse<Product>>(
    `/api/merchant/stores/${storeId}/products/${productId}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function deleteProduct(storeId: string, productId: string): Promise<void> {
  await merchantFetch(`/api/merchant/stores/${storeId}/products/${productId}`, {
    method: 'DELETE',
  });
}

export async function updateInventory(
  storeId: string,
  productId: string,
  payload: UpdateInventoryPayload,
  variantId?: string,
): Promise<Product> {
  const q = variantId ? `?variantId=${variantId}` : '';
  const res = await merchantFetch<ApiResponse<Product>>(
    `/api/merchant/stores/${storeId}/products/${productId}/inventory${q}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function updatePrice(
  storeId: string,
  productId: string,
  payload: UpdatePricePayload,
  variantId?: string,
): Promise<Product> {
  const q = variantId ? `?variantId=${variantId}` : '';
  const res = await merchantFetch<ApiResponse<Product>>(
    `/api/merchant/stores/${storeId}/products/${productId}/price${q}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function toggleProductStatus(
  storeId: string,
  productId: string,
  isActive: boolean,
): Promise<Product> {
  const res = await merchantFetch<ApiResponse<Product>>(
    `/api/merchant/stores/${storeId}/products/${productId}/status`,
    { method: 'PATCH', body: JSON.stringify({ isActive }) },
  );
  return res.data;
}

export async function listCategories(storeId: string): Promise<Category[]> {
  const res = await merchantFetch<ApiResponse<Category[]>>(
    `/api/merchant/stores/${storeId}/categories`,
  );
  return res.data;
}
