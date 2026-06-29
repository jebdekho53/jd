'use client';

import { useCategoryCatalogQuery } from '@/hooks/use-categories-governance';
import type { CategoryCatalogKind } from '@/types/category-governance';

export function useStoreCatalogKind(storeId: string | undefined) {
  const { data: catalog, isLoading, isError } = useCategoryCatalogQuery(storeId);
  const catalogKind = catalog?.[0]?.catalogKind as CategoryCatalogKind | undefined;

  return {
    catalogKind,
    isMenuStore: catalogKind === 'MENU',
    isProductStore: catalogKind === 'PRODUCT',
    isLoading,
    isError,
  };
}
