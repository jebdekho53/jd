'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { StoreGridSkeleton } from '@/components/common/skeletons';
import { Button } from '@/components/ui/button';
import { CategoryFilter } from '@/features/categories/category-filter';
import { SearchInput } from '@/features/search/search-input';
import { LocationBanner } from '@/features/stores/location-banner';
import { StoreCardItem } from '@/features/stores/store-card';
import { useCategories, useDiscoverStores } from '@/hooks/use-buyer-queries';
import { useLocationStore, useUiStore } from '@/store/ui-store';

export default function StoresPage() {
  const router = useRouter();
  const { lat, lng } = useLocationStore();
  const { storeSearchQuery, setStoreSearchQuery, selectedCategoryId, setSelectedCategoryId } =
    useUiStore();
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useCategories();

  const storeParams = useMemo(
    () => ({ lat, lng, radiusKm: 5, page, limit: 12 }),
    [lat, lng, page],
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
    return stores;
  }, [data?.data, storeSearchQuery]);

  const handleCategorySelect = (id: string | null) => {
    setSelectedCategoryId(id);
    if (id) {
      router.push(`/search?categoryId=${id}`);
    }
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stores near you</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approved stores within 5 km, sorted by distance
          </p>
        </div>

        <LocationBanner />

        <SearchInput
          value={storeSearchQuery}
          onChange={setStoreSearchQuery}
          placeholder="Search stores by name or area…"
        />

        <CategoryFilter
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={handleCategorySelect}
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
            description="Try adjusting your search or expanding your delivery area."
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
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                >
                  {isFetching ? 'Loading…' : 'Load more stores'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
