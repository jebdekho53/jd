import { apiGet, apiGetClient, unwrapPaginated } from '@/services/api/client';
import type {
  ApiResponse,
  BuyerProduct,
  BuyerProductWithStore,
  CategoryItem,
  DiscoverStoresParams,
  PaginatedResponse,
  SearchProductsParams,
  StoreCard,
  StoreDetail,
  StoreProductsParams,
} from '@/types/buyer';

export const buyerKeys = {
  all: ['buyer'] as const,
  stores: (params: DiscoverStoresParams) => [...buyerKeys.all, 'stores', params] as const,
  store: (slug: string) => [...buyerKeys.all, 'store', slug] as const,
  storeProducts: (slug: string, params: StoreProductsParams) =>
    [...buyerKeys.all, 'store-products', slug, params] as const,
  search: (params: SearchProductsParams) => [...buyerKeys.all, 'search', params] as const,
  categories: (storeId?: string) => [...buyerKeys.all, 'categories', storeId ?? 'global'] as const,
};

export async function discoverStores(params: DiscoverStoresParams): Promise<PaginatedResponse<StoreCard>> {
  const res = await apiGetClient<ApiResponse<StoreCard[]>>('/buyer/stores', {
    lat: params.lat,
    lng: params.lng,
    radiusKm: params.radiusKm ?? 5,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });
  return unwrapPaginated(res);
}

export async function getStoreBySlug(slug: string): Promise<StoreDetail> {
  const res = await apiGet<ApiResponse<StoreDetail>>(`/buyer/stores/${slug}`);
  return res.data;
}

export async function getStoreProducts(
  slug: string,
  params: StoreProductsParams = {},
): Promise<PaginatedResponse<BuyerProduct>> {
  const res = await apiGetClient<ApiResponse<BuyerProduct[]>>(`/buyer/stores/${slug}/products`, {
    categoryId: params.categoryId,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });
  return unwrapPaginated(res);
}

export async function searchProducts(
  params: SearchProductsParams,
): Promise<PaginatedResponse<BuyerProductWithStore>> {
  const res = await apiGetClient<ApiResponse<BuyerProductWithStore[]>>('/buyer/products/search', {
    q: params.q,
    categoryId: params.categoryId,
    storeId: params.storeId,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });
  return unwrapPaginated(res);
}

export async function getCategories(storeId?: string): Promise<CategoryItem[]> {
  const res = await apiGetClient<ApiResponse<CategoryItem[]>>('/buyer/categories', {
    storeId,
  });
  return res.data;
}
