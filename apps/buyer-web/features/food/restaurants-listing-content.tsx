'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { StoreGridSkeleton } from '@/components/common/skeletons';
import { SectionHeader } from '@/components/v2/section-header';
import { VerticalNav } from '@/features/home/vertical-nav';
import { RestaurantCard } from '@/features/food/restaurant-card';
import { Chip } from '@/design-system/primitives';
import { useCuisinesQuery, useRestaurantsQuery } from '@/hooks/use-food-queries';
import { useEffectiveLocation } from '@/store/location-store';

export function RestaurantsListingContent() {
  const router = useRouter();
  const { lat, lng, label, isReady } = useEffectiveLocation();
  const [cuisineSlug, setCuisineSlug] = useState<string | undefined>();
  const { data: cuisines = [] } = useCuisinesQuery();

  const params = useMemo(
    () => ({
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      cuisine: cuisineSlug,
      page: 1,
      limit: 36,
    }),
    [lat, lng, cuisineSlug],
  );

  const { data: restaurants = [], isLoading, isError, error, refetch } = useRestaurantsQuery(
    params,
    Boolean(lat && lng),
  );

  return (
    <PageShell>
      <div className="space-y-5">
        <VerticalNav className="-mx-1 px-1" />

        <div>
          <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">Restaurants</h1>
          {isReady && (
            <p className="mt-1 flex items-center gap-1 text-sm text-jd-text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              Delivering to {label}
            </p>
          )}
        </div>

        {cuisines.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <Chip size="sm" active={!cuisineSlug} onClick={() => setCuisineSlug(undefined)}>
              All cuisines
            </Chip>
            {cuisines.map((c) => (
              <Chip
                key={c.id}
                size="sm"
                active={cuisineSlug === c.slug}
                onClick={() => setCuisineSlug(c.slug)}
              >
                {c.name}
              </Chip>
            ))}
          </div>
        )}

        <section>
          <SectionHeader
            title="All restaurants"
            subtitle={
              isLoading
                ? 'Loading…'
                : `${restaurants.length} available`
            }
          />

          {!lat || !lng ? (
            <EmptyState
              variant="search"
              title="Set your location"
              description="Choose a delivery location to see restaurants near you."
            />
          ) : isLoading ? (
            <StoreGridSkeleton count={6} />
          ) : isError ? (
            <ErrorState
              message={error instanceof Error ? error.message : 'Failed to load restaurants'}
              onRetry={() => refetch()}
            />
          ) : restaurants.length === 0 ? (
            <EmptyState
              title="No restaurants found"
              description="Try a different cuisine filter or explore food on the home page."
              actionLabel="Back to food"
              onAction={() => router.push('/food')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-sm text-jd-text-muted">
          Browse by cuisine:{' '}
          {cuisines.slice(0, 6).map((c, i) => (
            <span key={c.id}>
              {i > 0 && ' · '}
              <Link href={`/cuisine/${c.slug}`} className="font-medium text-primary hover:underline">
                {c.name}
              </Link>
            </span>
          ))}
        </p>
      </div>
    </PageShell>
  );
}
