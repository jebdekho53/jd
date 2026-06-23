import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  buyerKeys,
  discoverStores,
  getCategories,
  getStoreBySlug,
  getStoreProducts,
  searchProducts,
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
  });
}
