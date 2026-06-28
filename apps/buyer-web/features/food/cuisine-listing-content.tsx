'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { StoreGridSkeleton } from '@/components/common/skeletons';
import { SectionHeader } from '@/components/v2/section-header';
import { VerticalNav } from '@/features/home/vertical-nav';
import { RestaurantCard } from '@/features/food/restaurant-card';
import { useRestaurantsQuery } from '@/hooks/use-food-queries';
import { useEffectiveLocation } from '@/store/location-store';

export function CuisineListingContent({
  cuisineName,
  cuisineSlug,
}: {
  cuisineName: string;
  cuisineSlug: string;
}) {
  const { lat, lng, label, isReady } = useEffectiveLocation();

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
          <nav className="text-sm text-jd-text-muted">
            <Link href="/food" className="hover:text-primary">Food</Link>
            <span className="mx-2">/</span>
            <span className="text-jd-text-primary">{cuisineName}</span>
          </nav>
          <h1 className="mt-2 text-xl font-bold text-jd-text-primary md:text-2xl">
            {cuisineName} restaurants
          </h1>
          <p className="mt-1 text-sm text-jd-text-muted">
            Order {cuisineName.toLowerCase()} food for delivery near you on JebDekho.
          </p>
          {isReady && (
            <p className="mt-1 flex items-center gap-1 text-xs text-jd-text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              Delivering to {label}
            </p>
          )}
        </div>

        <section>
          <SectionHeader
            title={`${cuisineName} near you`}
            subtitle={isLoading ? 'Loading…' : `${restaurants.length} restaurants`}
          />

          {!lat || !lng ? (
            <EmptyState
              variant="search"
              title="Set your location"
              description="Choose a delivery location to see restaurants serving this cuisine."
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
              title={`No ${cuisineName.toLowerCase()} restaurants yet`}
              description="Try browsing all restaurants or another cuisine."
              actionLabel="All restaurants"
              onAction={() => window.location.assign('/restaurants')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
