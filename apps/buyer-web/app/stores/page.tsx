'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { CategoryRail } from '@/components/discovery/category-explorer';
import { SearchInput } from '@/features/search/search-input';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { StoreGridSkeleton } from '@/components/common/skeletons';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/v2/section-header';
import { StoreCardItem } from '@/features/stores/store-card';
import { Chip } from '@/design-system/primitives';
import { useCategories, useDiscoverStores } from '@/hooks/use-buyer-queries';
import { useEffectiveLocation, useUiStore } from '@/store/ui-store';
import type { DiscoverStoresParams } from '@/types/buyer';

const SORT_OPTIONS: { value: NonNullable<DiscoverStoresParams['sort']>; label: string }[] = [
  { value: 'distance', label: 'Nearest' },
  { value: 'popular', label: 'Popular' },
  { value: 'fast', label: 'Fastest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'new', label: 'New' },
];

function parseSortParam(value: string | null): NonNullable<DiscoverStoresParams['sort']> {
  const valid = SORT_OPTIONS.map((o) => o.value);
  if (value && valid.includes(value as NonNullable<DiscoverStoresParams['sort']>)) {
    return value as NonNullable<DiscoverStoresParams['sort']>;
  }
  return 'distance';
}

export default function StoresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lat, lng, pincode, label, isReady } = useEffectiveLocation();
  const { storeSearchQuery, setStoreSearchQuery } = useUiStore();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<NonNullable<DiscoverStoresParams['sort']>>(() =>
    parseSortParam(searchParams.get('sort')),
  );

  useEffect(() => {
    setSort(parseSortParam(searchParams.get('sort')));
    setPage(1);
  }, [searchParams]);

  const { data: categories = [] } = useCategories();
  const storeParams = useMemo(
    () =>
      lat != null && lng != null
        ? { lat, lng, pincode, radiusKm: 20, page, limit: 12, sort }
        : null,
    [lat, lng, pincode, page, sort],
  );
  const { data, isLoading, isError, error, refetch, isFetching } = useDiscoverStores(
    storeParams ?? { lat: 0, lng: 0, radiusKm: 20, page, limit: 12, sort },
    isReady && storeParams != null,
  );

  const filteredStores = useMemo(() => {
    if (!data?.data) return [];
    if (!storeSearchQuery.trim()) return data.data;
    const q = storeSearchQuery.toLowerCase();
    return data.data.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.address.line1.toLowerCase().includes(q),
    );
  }, [data?.data, storeSearchQuery]);

  const handleSortChange = (next: NonNullable<DiscoverStoresParams['sort']>) => {
    setSort(next);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'distance') params.delete('sort');
    else params.set('sort', next);
    const qs = params.toString();
    router.replace(qs ? `/stores?${qs}` : '/stores', { scroll: false });
  };

  return (
    <PageShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">Nearby stores</h1>
          {isReady && (
            <p className="mt-1 flex items-center gap-1 text-sm text-jd-text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              Delivering to {label}
            </p>
          )}
        </div>

        <SearchInput
          value={storeSearchQuery}
          onChange={setStoreSearchQuery}
          placeholder="Search stores by name or area…"
        />

        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {SORT_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              size="sm"
              active={sort === opt.value}
              onClick={() => handleSortChange(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>

        <section aria-labelledby="browse-cat" className="md:hidden">
          <SectionHeader title="Categories" href="/categories" linkLabel="All" />
          <CategoryRail categories={categories} />
        </section>

        <section aria-labelledby="all-stores">
          <SectionHeader
            title="All stores"
            subtitle={
              isLoading
                ? 'Loading…'
                : `${filteredStores.length} store${filteredStores.length !== 1 ? 's' : ''}`
            }
          />

          {!lat || !lng ? (
            <EmptyState
              variant="search"
              title="Set your location"
              description="Choose a delivery location to see stores that can deliver to you."
            />
          ) : isLoading ? (
            <StoreGridSkeleton />
          ) : isError ? (
            <ErrorState
              message={error instanceof Error ? error.message : 'Failed to load stores'}
              onRetry={() => refetch()}
            />
          ) : filteredStores.length === 0 ? (
            <EmptyState
              title="No stores found"
              description="Try a different search or expand your delivery area."
              actionLabel="Search products"
              onAction={() => router.push('/search')}
            />
          ) : (
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
