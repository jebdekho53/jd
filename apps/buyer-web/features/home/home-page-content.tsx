'use client';

import Link from 'next/link';
import { SmartSearchSection } from '@/components/discovery/smart-search-section';
import { CategoryExplorer } from '@/components/discovery/category-explorer';
import { HeroSection } from '@/components/merchandising/home-sections';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { SectionHeader } from '@/components/v2/section-header';
import { StoreGridSkeleton } from '@/components/common/skeletons';
import { StoreCardItem } from '@/features/stores/store-card';
import { useCategories, useDiscoverStores } from '@/hooks/use-buyer-queries';
import { useEffectiveLocation } from '@/store/location-store';
import { TopDealsSection } from '@/features/promotions/top-deals-section';
import {
  FlashSalesSection,
  OffersNearYouSection,
} from '@/features/promotions/campaign-sections';
import { useMemo } from 'react';

function StoreSection({
  title,
  subtitle,
  sort,
  href,
  lat,
  lng,
}: {
  title: string;
  subtitle?: string;
  sort: 'distance' | 'popular' | 'fast' | 'new' | 'rating';
  href: string;
  lat: number;
  lng: number;
}) {
  const params = useMemo(
    () => ({ lat, lng, radiusKm: 20, page: 1, limit: 8, sort }),
    [lat, lng, sort],
  );
  const { data, isLoading } = useDiscoverStores(params);
  const stores = data?.data ?? [];

  if (!isLoading && stores.length === 0) return null;

  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} href={href} linkLabel="View all" />
      {isLoading ? (
        <StoreGridSkeleton count={3} />
      ) : (
        <HorizontalCarousel label={title} itemClassName="w-[280px]">
          {stores.map((store) => (
            <StoreCardItem key={`${sort}-${store.id}`} store={store} variant="compact" />
          ))}
        </HorizontalCarousel>
      )}
    </section>
  );
}

export function HomePageContent() {
  const { lat, lng } = useEffectiveLocation();
  const { data: categories = [] } = useCategories();
  const hasLocation = Boolean(lat && lng);

  return (
    <div className="space-y-10 animate-fade-in">
      <HeroSection />
      <FlashSalesSection />
      <OffersNearYouSection />
      <TopDealsSection />
      <SmartSearchSection />

      {hasLocation ? (
        <>
          <StoreSection title="Nearby stores" subtitle="Delivering to your location" sort="distance" href="/stores" lat={lat} lng={lng} />
          <StoreSection title="Popular stores" subtitle="Most loved in your area" sort="popular" href="/stores?sort=popular" lat={lat} lng={lng} />
          <StoreSection title="Fast delivery stores" subtitle="Quickest prep times" sort="fast" href="/stores?sort=fast" lat={lat} lng={lng} />
          <StoreSection title="Top rated stores" subtitle="Highest customer ratings" sort="rating" href="/stores?sort=rating" lat={lat} lng={lng} />
          <StoreSection title="New stores" subtitle="Recently joined on JebDekho" sort="new" href="/stores?sort=new" lat={lat} lng={lng} />
        </>
      ) : (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-jd-text-muted">
          Set your delivery location to discover nearby stores.
        </p>
      )}

      <section aria-labelledby="cat-heading">
        <SectionHeader title="Browse by category" subtitle="Find stores selling what you need" href="/categories" linkLabel="All categories" />
        <CategoryExplorer categories={categories} />
      </section>

      <section className="rounded-2xl bg-cream-3 p-6 text-center">
        <p className="text-sm font-medium text-jd-text-primary">Compare prices across stores</p>
        <p className="mt-1 text-xs text-jd-text-muted">Search a product to see which nearby store offers the best price.</p>
        <Link href="/search" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          Search products →
        </Link>
      </section>
    </div>
  );
}
