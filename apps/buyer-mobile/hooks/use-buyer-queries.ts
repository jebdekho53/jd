import { useQuery } from '@tanstack/react-query';
import {
  discoverStores,
  fetchCategories,
  getProduct,
  getStore,
  getStoreProducts,
  searchProducts,
  type DiscoverStoresParams,
  type SearchProductsParams,
} from '@/services/buyer-api';

export const buyerKeys = {
  categories: ['categories'] as const,
  stores: (params: DiscoverStoresParams) => ['stores', 'list', params] as const,
  store: (slug: string) => ['stores', 'detail', slug] as const,
  storeProducts: (slug: string, params?: object) => ['stores', slug, 'products', params] as const,
  search: (params: SearchProductsParams) => ['products', 'search', params] as const,
  product: (id: string, storeSlug?: string) => ['products', 'detail', id, storeSlug] as const,
};

export function useCategoriesQuery() {
  return useQuery({ queryKey: buyerKeys.categories, queryFn: fetchCategories, staleTime: 5 * 60_000 });
}

export function useDiscoverStoresQuery(params: DiscoverStoresParams | null) {
  return useQuery({
    queryKey: buyerKeys.stores(params ?? { lat: 0, lng: 0 }),
    queryFn: () => discoverStores(params!),
    enabled: !!params,
    staleTime: 60_000,
  });
}

export function useStoreQuery(slug: string) {
  return useQuery({
    queryKey: buyerKeys.store(slug),
    queryFn: () => getStore(slug),
    enabled: !!slug,
  });
}

export function useStoreProductsQuery(slug: string, params?: { categoryId?: string; page?: number }) {
  return useQuery({
    queryKey: buyerKeys.storeProducts(slug, params),
    queryFn: () => getStoreProducts(slug, params),
    enabled: !!slug,
  });
}

export function useProductSearchQuery(params: SearchProductsParams, enabled = true) {
  return useQuery({
    queryKey: buyerKeys.search(params),
    queryFn: () => searchProducts(params),
    enabled: enabled && (!!params.q?.trim() || !!params.categoryId),
    staleTime: 30_000,
  });
}

export function useProductQuery(id: string, storeSlug?: string) {
  return useQuery({
    queryKey: buyerKeys.product(id, storeSlug),
    queryFn: () => getProduct(id, storeSlug),
    enabled: !!id,
  });
}
