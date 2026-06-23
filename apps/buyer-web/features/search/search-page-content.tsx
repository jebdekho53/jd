'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { Button } from '@/components/ui/button';
import { CategoryFilter } from '@/features/categories/category-filter';
import { ProductCard } from '@/features/products/product-card';
import { SearchInput } from '@/features/search/search-input';
import { useCategories, useProductSearch } from '@/hooks/use-buyer-queries';
import { useDebounce } from '@/hooks/use-debounce';
import type { BuyerProductWithStore } from '@/types/buyer';

export function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('categoryId');
  const initialQuery = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState<string | null>(initialCategory);
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<BuyerProductWithStore[]>([]);

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    setPage(1);
    setAccumulated([]);
  }, [debouncedQuery, categoryId]);

  const { data: categories = [] } = useCategories();

  const searchParams_ = useMemo(
    () => ({
      q: debouncedQuery.trim() || undefined,
      categoryId: categoryId ?? undefined,
      page,
      limit: 20,
    }),
    [debouncedQuery, categoryId, page],
  );

  const canSearch =
    debouncedQuery.trim().length >= 2 || Boolean(categoryId);

  const { data, isLoading, isFetching, isError, error, refetch } = useProductSearch(
    searchParams_,
    canSearch,
  );

  useEffect(() => {
    if (!data?.data) return;
    setAccumulated((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
  }, [data, page]);

  const showEmptyPrompt = !canSearch;

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Search products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find groceries across nearby stores
          </p>
        </div>

        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by product, brand, or tag…"
          autoFocus
        />

        <CategoryFilter
          categories={categories}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />

        {showEmptyPrompt && (
          <EmptyState
            variant="search"
            title="Start typing to search"
            description="Enter at least 2 characters, or pick a category to browse products."
          />
        )}

        {!showEmptyPrompt && isLoading && page === 1 && <ProductGridSkeleton />}

        {!showEmptyPrompt && isError && (
          <ErrorState
            message={error instanceof Error ? error.message : 'Search failed'}
            onRetry={() => refetch()}
          />
        )}

        {!showEmptyPrompt && !isLoading && !isError && accumulated.length === 0 && (
          <EmptyState
            variant="search"
            title="No products found"
            description={
              debouncedQuery
                ? `No results for "${debouncedQuery}". Try a different search term.`
                : 'No products in this category right now.'
            }
          />
        )}

        {!showEmptyPrompt && !isError && accumulated.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground" role="status">
              {data?.meta.total ?? accumulated.length} result
              {(data?.meta.total ?? 0) !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {accumulated.map((product) => (
                <ProductCard key={`${product.id}-${product.store.id}`} product={product} showStore />
              ))}
            </div>

            {data && data.meta.page < data.meta.totalPages && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                >
                  {isFetching ? 'Loading…' : 'Load more results'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
