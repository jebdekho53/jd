'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/site-shell';
import { CategoryExplorer } from '@/components/discovery/category-explorer';
import { SearchInput } from '@/features/search/search-input';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { StoreGridSkeleton } from '@/components/common/skeletons';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/v2/section-header';
import { StoreCardItem } from '@/features/stores/store-card';
import { useCategories, useDiscoverStores } from '@/hooks/use-buyer-queries';
import { useEffectiveLocation, useUiStore } from '@/store/ui-store';

export default function StoresPage() {
  const router = useRouter();
  const { lat, lng, pincode } = useEffectiveLocation();
  const { storeSearchQuery, setStoreSearchQuery } = useUiStore();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'distance' | 'rating'>('distance');

  const { data: categories = [] } = useCategories();
  const storeParams = useMemo(
    () => ({ lat, lng, pincode, radiusKm: 20, page, limit: 12 }),
    [lat, lng, pincode, page],
  );
  const { data, isLoading, isError, error, refetch, isFetching } = useDiscoverStores(storeParams);

  const filteredStores = useMemo(() => {
    if (!data?.data) return [];
    let stores = data.data;
    if (storeSearchQuery.trim()) {
      const q = storeSearchQuery.toLowerCase();
      stores = stores.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.address.line1.toLowerCase().includes(q),
      );
    }
    if (sort === 'rating') {
      stores = [...stores].sort((a, b) => b.ratingAvg - a.ratingAvg);
    }
    return stores;
  }, [data?.data, storeSearchQuery, sort]);

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-jd-text-primary">Nearby stores</h1>
          <p className="mt-1 text-sm text-jd-text-muted">
            Local vendors within 20 km — compare prices and delivery times
          </p>
        </div>

        <SearchInput
          value={storeSearchQuery}
          onChange={setStoreSearchQuery}
          placeholder="Search stores by name or area…"
        />

        <div className="flex gap-2">
          {(['distance', 'rating'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition btn-press ${
                sort === s
                  ? 'bg-primary text-white'
                  : 'border border-border/60 bg-card text-jd-text-muted hover:border-primary/30'
              }`}
            >
              {s === 'distance' ? 'Nearest' : 'Top rated'}
            </button>
          ))}
        </div>

        <section aria-labelledby="browse-cat">
          <SectionHeader title="Browse by category" href="/categories" />
          <CategoryExplorer categories={categories} />
        </section>

        <section aria-labelledby="all-stores">
          <SectionHeader
            title="All stores"
            subtitle={`${filteredStores.length} store${filteredStores.length !== 1 ? 's' : ''}`}
          />

          {isLoading && <StoreGridSkeleton />}
          {isError && (
            <ErrorState
              message={error instanceof Error ? error.message : 'Failed to load stores'}
              onRetry={() => refetch()}
            />
          )}
          {!isLoading && !isError && filteredStores.length === 0 && (
            <EmptyState
              title="No stores found"
              description="Try a different search or expand your delivery area."
              actionLabel="Search products"
              onAction={() => router.push('/search')}
            />
          )}
          {!isLoading && !isError && filteredStores.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredStores.map((store) => (
                  <StoreCardItem key={store.id} store={store} />
                ))}
              </div>
              {data && data.meta.page < data.meta.totalPages && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={isFetching}>
                    {isFetching ? 'Loading…' : 'Load more stores'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}
