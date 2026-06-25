import { apiGet, apiGetClient, buildUrl, unwrapPaginated } from '@/services/api/client';
import type {
  ApiResponse,
  BuyerProduct,
  BuyerProductWithStore,
  CategoryItem,
  DiscoverStoresParams,
  PaginatedResponse,
  SearchProductsParams,
  StoreCard,
  StoreCardWithCount,
  StoreDetail,
  StoreProductsParams,
  StoreSearchGroup,
  UnifiedSearchResult,
  SearchSuggestionsResult,
  TrendingSearchResult,
} from '@/types/buyer';

const BUYER_FETCH_DEBUG = process.env.NEXT_PUBLIC_BUYER_FETCH_DEBUG === 'true';

function logBuyerFetch(method: string, url: string, meta?: Record<string, unknown>) {
  if (BUYER_FETCH_DEBUG && typeof window !== 'undefined') {
    console.info(`[buyer-fetch] ${method} ${url}`, meta ?? '');
  }
}

export const buyerKeys = {
  all: ['buyer'] as const,
  stores: (params: DiscoverStoresParams) => [...buyerKeys.all, 'stores', params] as const,
  store: (slug: string) => [...buyerKeys.all, 'store', slug] as const,
  storeProducts: (slug: string, params: StoreProductsParams) =>
    [...buyerKeys.all, 'store-products', slug, params] as const,
  search: (params: SearchProductsParams) => [...buyerKeys.all, 'search', params] as const,
  categories: (storeId?: string) => [...buyerKeys.all, 'categories', storeId ?? 'global'] as const,
  categoryStores: (categoryId: string, params: DiscoverStoresParams & { subcategoryId?: string }) =>
    [...buyerKeys.all, 'category-stores', categoryId, params] as const,
  searchGrouped: (params: SearchProductsParams) => [...buyerKeys.all, 'search-grouped', params] as const,
  unifiedSearch: (params: SearchProductsParams & { tab?: string }) =>
    [...buyerKeys.all, 'unified-search', params] as const,
  searchSuggestions: (q: string, lat?: number, lng?: number) =>
    [...buyerKeys.all, 'search-suggestions', q, lat, lng] as const,
  searchTrending: (period: string, lat?: number, lng?: number) =>
    [...buyerKeys.all, 'search-trending', period, lat, lng] as const,
};

export async function discoverStores(params: DiscoverStoresParams): Promise<PaginatedResponse<StoreCard>> {
  const query = {
    lat: params.lat,
    lng: params.lng,
    radiusKm: params.radiusKm ?? 20,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    sort: params.sort ?? 'distance',
  };
  const url = buildUrl('/buyer/stores', query);
  logBuyerFetch('GET', url, query);
  const res = await apiGetClient<ApiResponse<StoreCard[]>>('/buyer/stores', query);
  logBuyerFetch('GET', url, { count: res.data.length, meta: res.meta });
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
    subcategoryId: params.subcategoryId,
    storeId: params.storeId,
    lat: params.lat,
    lng: params.lng,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    sort: params.sort,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });
  return unwrapPaginated(res);
}

export async function unifiedSearch(
  params: SearchProductsParams & { tab?: string },
): Promise<UnifiedSearchResult> {
  const res = await apiGetClient<ApiResponse<UnifiedSearchResult>>('/buyer/search', {
    q: params.q,
    categoryId: params.categoryId,
    subcategoryId: params.subcategoryId,
    storeId: params.storeId,
    lat: params.lat,
    lng: params.lng,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    sort: params.sort ?? 'relevance',
    tab: params.tab ?? 'all',
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });
  return res.data;
}

export async function fetchSearchSuggestions(
  q: string,
  lat?: number,
  lng?: number,
): Promise<SearchSuggestionsResult> {
  const res = await apiGetClient<ApiResponse<SearchSuggestionsResult>>('/buyer/search/suggestions', {
    q,
    lat,
    lng,
  });
  return res.data;
}

export async function fetchTrendingSearches(
  period: '24h' | '7d' | '30d' = '7d',
  lat?: number,
  lng?: number,
): Promise<TrendingSearchResult> {
  const res = await apiGetClient<ApiResponse<TrendingSearchResult>>('/buyer/search/trending', {
    period,
    lat,
    lng,
  });
  return res.data;
}

export async function getCategories(storeId?: string): Promise<CategoryItem[]> {
  const query = { storeId };
  const url = buildUrl('/buyer/categories', query);
  logBuyerFetch('GET', url, query);
  const res = await apiGetClient<ApiResponse<CategoryItem[]>>('/buyer/categories', query);
  logBuyerFetch('GET', url, { count: res.data.length });
  return res.data;
}

export async function getCategoryStores(
  categoryId: string,
  params: DiscoverStoresParams & { subcategoryId?: string },
): Promise<PaginatedResponse<StoreCardWithCount>> {
  const query = {
    lat: params.lat,
    lng: params.lng,
    radiusKm: params.radiusKm ?? 20,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    subcategoryId: params.subcategoryId,
  };
  const res = await apiGetClient<ApiResponse<StoreCardWithCount[]>>(
    `/buyer/categories/${categoryId}/stores`,
    query,
  );
  return unwrapPaginated(res);
}

export async function searchProductsGrouped(
  params: SearchProductsParams,
): Promise<{ groups: StoreSearchGroup[]; total: number }> {
  const res = await apiGetClient<ApiResponse<StoreSearchGroup[]>>('/buyer/products/search/grouped', {
    q: params.q,
    categoryId: params.categoryId,
    storeId: params.storeId,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });
  return { groups: res.data, total: res.meta?.total ?? res.data.length };
}
