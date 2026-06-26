import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  buyerKeys,
  discoverStores,
  fetchSearchSuggestions,
  fetchTrendingSearches,
  getCategories,
  getCategoryStores,
  getStoreBySlug,
  getStoreProducts,
  getProductById,
  searchProducts,
  searchProductsGrouped,
  unifiedSearch,
} from '@/services/buyer/buyer-api';
import type {
  DiscoverStoresParams,
  SearchProductsParams,
  StoreProductsParams,
} from '@/types/buyer';

export function useDiscoverStores(params: DiscoverStoresParams, enabled = true) {
  return useQuery({
    queryKey: buyerKeys.stores(params),
    queryFn: () => discoverStores(params),
    enabled: enabled && Boolean(params.lat && params.lng),
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useStore(slug: string) {
  return useQuery({
    queryKey: buyerKeys.store(slug),
    queryFn: () => getStoreBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useStoreProducts(slug: string, params: StoreProductsParams = {}) {
  return useQuery({
    queryKey: buyerKeys.storeProducts(slug, params),
    queryFn: () => getStoreProducts(slug, params),
    enabled: Boolean(slug),
    placeholderData: keepPreviousData,
  });
}

export function useProductById(id: string, storeSlug?: string) {
  return useQuery({
    queryKey: buyerKeys.product(id, storeSlug),
    queryFn: () => getProductById(id, storeSlug),
    enabled: Boolean(id),
  });
}

export function useProductSearch(params: SearchProductsParams, enabled = true) {
  const hasQuery = Boolean(params.q && params.q.trim().length >= 2);
  const hasCategory = Boolean(params.categoryId);

  return useQuery({
    queryKey: buyerKeys.search(params),
    queryFn: () => searchProducts(params),
    enabled: enabled && (hasQuery || hasCategory),
    placeholderData: keepPreviousData,
  });
}

export function useCategories(storeId?: string) {
  return useQuery({
    queryKey: buyerKeys.categories(storeId),
    queryFn: () => getCategories(storeId),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCategoryStores(
  categoryId: string,
  params: DiscoverStoresParams & { subcategoryId?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: buyerKeys.categoryStores(categoryId, params),
    queryFn: () => getCategoryStores(categoryId, params),
    enabled: enabled && Boolean(categoryId && params.lat && params.lng),
    placeholderData: keepPreviousData,
  });
}

export function useGroupedProductSearch(params: SearchProductsParams, enabled = true) {
  const hasQuery = Boolean(params.q && params.q.trim().length >= 2);
  const hasCategory = Boolean(params.categoryId);

  return useQuery({
    queryKey: buyerKeys.searchGrouped(params),
    queryFn: () => searchProductsGrouped(params),
    enabled: enabled && (hasQuery || hasCategory),
    placeholderData: keepPreviousData,
  });
}

export function useUnifiedSearch(
  params: SearchProductsParams & { tab?: string },
  enabled = true,
) {
  const hasQuery = Boolean(params.q && params.q.trim().length >= 2);
  const hasCategory = Boolean(params.categoryId || params.subcategoryId);

  return useQuery({
    queryKey: buyerKeys.unifiedSearch(params),
    queryFn: () => unifiedSearch(params),
    enabled: enabled && (hasQuery || hasCategory),
    placeholderData: keepPreviousData,
  });
}

export function useSearchSuggestions(q: string, lat?: number, lng?: number) {
  return useQuery({
    queryKey: buyerKeys.searchSuggestions(q, lat, lng),
    queryFn: () => fetchSearchSuggestions(q, lat, lng),
    enabled: q.trim().length >= 1,
    staleTime: 30_000,
  });
}

export function useTrendingSearches(period: '24h' | '7d' | '30d' = '7d', lat?: number, lng?: number) {
  return useQuery({
    queryKey: buyerKeys.searchTrending(period, lat, lng),
    queryFn: () => fetchTrendingSearches(period, lat, lng),
    staleTime: 60_000,
  });
}
