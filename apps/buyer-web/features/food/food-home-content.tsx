'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, UtensilsCrossed } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { StoreGridSkeleton } from '@/components/common/skeletons';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { SectionHeader } from '@/components/v2/section-header';
import { VerticalNav } from '@/features/home/vertical-nav';
import { RestaurantCard } from '@/features/food/restaurant-card';
import { Chip } from '@/design-system/primitives';
import { useCuisinesQuery, useRestaurantsQuery } from '@/hooks/use-food-queries';
import { useEffectiveLocation } from '@/store/location-store';

export function FoodHomeContent() {
  const { lat, lng, label, isReady } = useEffectiveLocation();
  const [cuisineSlug, setCuisineSlug] = useState<string | undefined>();
  const { data: cuisines = [] } = useCuisinesQuery();

  const params = useMemo(
    () => ({
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      cuisine: cuisineSlug,
      page: 1,
      limit: 24,
    }),
    [lat, lng, cuisineSlug],
  );

  const { data: restaurants = [], isLoading, isError, error, refetch } = useRestaurantsQuery(
    params,
    Boolean(lat && lng),
  );

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <VerticalNav className="-mx-1 px-1" />
          <div className="mt-5 flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <UtensilsCrossed className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">Food delivery</h1>
              <p className="mt-1 text-sm text-jd-text-muted">
                Restaurants, cloud kitchens & cafés near you
              </p>
              {isReady && (
                <p className="mt-1 flex items-center gap-1 text-xs text-jd-text-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  Delivering to {label}
                </p>
              )}
            </div>
          </div>
        </div>

        {cuisines.length > 0 && (
          <section aria-labelledby="food-cuisines">
            <SectionHeader title="Cuisines" href="/restaurants" linkLabel="All restaurants" />
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              <Chip
                size="sm"
                active={!cuisineSlug}
                onClick={() => setCuisineSlug(undefined)}
              >
                All
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
          </section>
        )}

        <section aria-labelledby="nearby-restaurants">
          <SectionHeader
            title="Restaurants near you"
            subtitle={
              isLoading
                ? 'Loading…'
                : `${restaurants.length} restaurant${restaurants.length !== 1 ? 's' : ''}`
            }
            href="/restaurants"
            linkLabel="View all"
          />

          {!lat || !lng ? (
            <EmptyState
              variant="search"
              title="Set your location"
              description="Choose a delivery location to discover restaurants that deliver to you."
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
              description="Try another cuisine or check back as we expand coverage in your area."
              actionLabel="Browse grocery"
              onAction={() => window.location.assign('/')}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.slice(0, 9).map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
              {restaurants.length > 9 && (
                <div className="pt-2 text-center">
                  <Link
                    href="/restaurants"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    View all {restaurants.length} restaurants →
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        {restaurants.length > 0 && (
          <section>
            <SectionHeader title="Top picks" subtitle="Highly rated near you" />
            <HorizontalCarousel label="Top restaurants" itemClassName="w-[260px] sm:w-[280px]">
              {restaurants.slice(0, 8).map((r) => (
                <RestaurantCard key={`top-${r.id}`} restaurant={r} variant="compact" />
              ))}
            </HorizontalCarousel>
          </section>
        )}
      </div>
    </PageShell>
  );
}
