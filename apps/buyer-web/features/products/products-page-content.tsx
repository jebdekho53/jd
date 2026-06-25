'use client';

import { useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { SmartSearchSection } from '@/components/discovery/smart-search-section';
import { CategoryFilter } from '@/features/categories/category-filter';
import { ProductCard } from '@/features/products/product-card';
import { useCategories, useProductSearch } from '@/hooks/use-buyer-queries';
import { Button } from '@/components/ui/button';

export function ProductsPageContent() {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useCategories();
  const effectiveCategoryId = categoryId ?? categories[0]?.id;

  const searchParams = useMemo(
    () => ({ categoryId: effectiveCategoryId, page, limit: 20 }),
    [effectiveCategoryId, page],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useProductSearch(
    searchParams,
    Boolean(effectiveCategoryId),
  );

  const products = data?.data ?? [];

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-jd-text-primary">Browse products</h1>
          <p className="mt-1 text-sm text-jd-text-muted">
            Discover groceries from nearby stores
          </p>
        </div>

        <SmartSearchSection />

        <CategoryFilter
          categories={categories}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />

        {isLoading && <ProductGridSkeleton />}

        {isError && (
          <ErrorState
            message={error instanceof Error ? error.message : 'Failed to load products'}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && products.length === 0 && (
          <EmptyState
            variant="search"
            title="No products available"
            description="Try a different category or search for specific items."
          />
        )}

        {!isLoading && !isError && products.length > 0 && (
          <>
            <p className="text-sm text-jd-text-muted" role="status">
              {data?.meta.total ?? products.length} products
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={`${product.id}-${product.store.id}`}
                  product={product}
                  showStore
                  trackView
                />
              ))}
            </div>
            {data && data.meta.page < data.meta.totalPages && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={isFetching}>
                  {isFetching ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
