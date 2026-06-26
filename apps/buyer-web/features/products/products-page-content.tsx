'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, MapPin, SlidersHorizontal } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { CategoryFilter } from '@/features/categories/category-filter';
import { ProductCard } from '@/features/products/product-card';
import { BottomSheet, Chip } from '@/design-system/primitives';
import { useCategories, useProductSearch } from '@/hooks/use-buyer-queries';
import { useEffectiveLocation } from '@/store/location-store';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/v2/section-header';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest' },
  { value: 'price_low_high', label: 'Price ↑' },
  { value: 'price_high_low', label: 'Price ↓' },
  { value: 'rating', label: 'Top rated' },
  { value: 'fastest_delivery', label: 'Fastest' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export function ProductsPageContent() {
  const router = useRouter();
  const { lat, lng, pincode, label, isReady } = useEffectiveLocation();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortValue>('distance');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const effectiveCategoryId = categoryId ?? categories[0]?.id;

  const searchParams = useMemo(
    () => ({
      categoryId: effectiveCategoryId,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      pincode: pincode ?? undefined,
      sort,
      page,
      limit: 20,
    }),
    [effectiveCategoryId, lat, lng, pincode, sort, page],
  );

  const canFetch = Boolean(effectiveCategoryId && lat && lng);

  const { data, isLoading, isError, error, refetch, isFetching } = useProductSearch(
    searchParams,
    canFetch,
  );

  const products = data?.data ?? [];
  const sortActive = sort !== 'distance';
  const filterCount = (categoryId ? 1 : 0) + (sortActive ? 1 : 0);

  return (
    <PageShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">Browse products</h1>
          {isReady && (
            <p className="mt-1 flex items-center gap-1 text-sm text-jd-text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              Near {label}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push('/search')}
          className="flex h-11 w-full items-center rounded-2xl border border-border bg-card px-4 text-left text-sm text-jd-text-muted shadow-card transition hover:border-primary/30"
        >
          Search all products…
        </button>

        {!lat || !lng ? (
          <EmptyState
            variant="search"
            title="Set your location"
            description="Choose a delivery location to browse products from nearby stores."
          />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
                <CategoryFilter
                  categories={categories}
                  selectedId={categoryId}
                  onSelect={(id) => {
                    setCategoryId(id);
                    setPage(1);
                  }}
                />
              </div>
              <Chip
                size="sm"
                active={filterCount > 0}
                leadingIcon={<SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />}
                onClick={() => setFiltersOpen(true)}
                className="shrink-0"
              >
                {filterCount > 0 ? filterCount : 'Sort'}
              </Chip>
            </div>

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
                <SectionHeader
                  title="Products"
                  subtitle={`${data?.meta.total ?? products.length} items`}
                />
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
          </>
        )}
      </div>

      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Sort products"
        footer={
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground btn-press"
          >
            Apply
          </button>
        }
      >
        <div className="space-y-1 pb-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setSort(opt.value);
                setPage(1);
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition',
                sort === opt.value ? 'bg-primary/5 font-semibold text-primary' : 'hover:bg-muted',
              )}
            >
              {opt.label}
              {sort === opt.value && <Check className="h-4 w-4" aria-hidden />}
            </button>
          ))}
        </div>
      </BottomSheet>
    </PageShell>
  );
}
