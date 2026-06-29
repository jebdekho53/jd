'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, UtensilsCrossed } from 'lucide-react';
import { CategoryExplorer, CategoryRail } from '@/components/discovery/category-explorer';
import { HeroCarousel } from '@/components/v2/hero-carousel';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { SectionHeader } from '@/components/v2/section-header';
import { MembershipBanner, ReferralBanner } from '@/components/merchandising/home-banners';
import { RecentlyViewedRail } from '@/components/merchandising/recently-viewed-rail';
import { StoreGridSkeleton } from '@/components/common/skeletons';
import { StoreCardItem } from '@/features/stores/store-card';
import { RestaurantCard } from '@/features/food/restaurant-card';
import { VerticalNav } from '@/features/home/vertical-nav';
import { useCategories, useDiscoverStores } from '@/hooks/use-buyer-queries';
import { useRestaurantsQuery } from '@/hooks/use-food-queries';
import { useEffectiveLocation } from '@/store/location-store';
import { TopDealsSection } from '@/features/promotions/top-deals-section';
import {
  FlashSalesSection,
  OffersNearYouSection,
} from '@/features/promotions/campaign-sections';

function StoreSection({
  title,
  subtitle,
  sort,
  href,
  lat,
  lng,
  pincode,
}: {
  title: string;
  subtitle?: string;
  sort: 'distance' | 'popular' | 'fast' | 'new' | 'rating';
  href: string;
  lat: number;
  lng: number;
  pincode?: string;
}) {
  const params = useMemo(
    () => ({ lat, lng, pincode, radiusKm: 20, page: 1, limit: 8, sort }),
    [lat, lng, pincode, sort],
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
        <HorizontalCarousel label={title} itemClassName="w-[260px] sm:w-[280px]">
          {stores.map((store) => (
            <StoreCardItem key={`${sort}-${store.id}`} store={store} variant="compact" />
          ))}
        </HorizontalCarousel>
      )}
    </section>
  );
}

function LocationGate() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-primary/30 bg-primary/5 px-6 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <MapPin className="h-6 w-6" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-semibold text-jd-text-primary">Set your delivery location</p>
        <p className="mt-1 text-xs text-jd-text-muted">
          We&apos;ll show stores and the best prices near you.
        </p>
      </div>
    </section>
  );
}

function FoodSection({ lat, lng, pincode }: { lat: number; lng: number; pincode?: string }) {
  const params = useMemo(
    () => ({ lat, lng, pincode, page: 1, limit: 8 }),
    [lat, lng, pincode],
  );
  const { data: restaurants = [], isLoading } = useRestaurantsQuery(params, true);

  if (!isLoading && restaurants.length === 0) return null;

  return (
    <section aria-labelledby="food-nearby">
      <SectionHeader
        title="Food near you"
        subtitle="Restaurants & cloud kitchens"
        href="/food"
        linkLabel="Order food"
      />
      {isLoading ? (
        <StoreGridSkeleton count={3} />
      ) : (
        <HorizontalCarousel label="Food near you" itemClassName="w-[260px] sm:w-[280px]">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} variant="compact" />
          ))}
        </HorizontalCarousel>
      )}
    </section>
  );
}

function GroceryQuickLink() {
  return (
    <section className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-cream-3 to-primary/5 p-6 md:p-8">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <UtensilsCrossed className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-lg font-bold text-jd-text-primary md:text-xl">Craving restaurant food?</p>
          <p className="mt-1 text-sm text-jd-text-muted">
            Switch to Food for menus, combos and delivery from local restaurants.
          </p>
          <Link
            href="/food"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary btn-press"
          >
            Explore food
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomePageContent() {
  const { lat, lng, pincode, isReady } = useEffectiveLocation();
  const { data: categories = [] } = useCategories();
  const hasLocation = isReady && lat != null && lng != null;

  return (
    <div className="space-y-7 animate-fade-in md:space-y-10">
      <VerticalNav className="-mx-1 px-1" />
      <HeroCarousel />

      {/* Quick categories — top priority on mobile */}
      <section aria-labelledby="quick-cats">
        <SectionHeader
          title="Shop by category"
          href="/categories"
          linkLabel="All categories"
        />
        <CategoryRail categories={categories} className="md:hidden" />
        <CategoryExplorer categories={categories} className="hidden md:grid" />
      </section>

      <FlashSalesSection />

      {hasLocation ? (
        <>
          <StoreSection title="Nearby stores" subtitle="Delivering to your location" sort="distance" href="/stores" lat={lat!} lng={lng!} pincode={pincode} />
          <FoodSection lat={lat!} lng={lng!} pincode={pincode} />
          <TopDealsSection />
          <OffersNearYouSection />
          <StoreSection title="Popular stores" subtitle="Most loved in your area" sort="popular" href="/stores?sort=popular" lat={lat!} lng={lng!} pincode={pincode} />
          <RecentlyViewedRail />
          <StoreSection title="Fast delivery" subtitle="Quickest prep times" sort="fast" href="/stores?sort=fast" lat={lat!} lng={lng!} pincode={pincode} />
          <MembershipBanner />
          <StoreSection title="Top rated stores" subtitle="Highest customer ratings" sort="rating" href="/stores?sort=rating" lat={lat!} lng={lng!} pincode={pincode} />
          <StoreSection title="New on JebDekho" subtitle="Recently joined stores" sort="new" href="/stores?sort=new" lat={lat!} lng={lng!} pincode={pincode} />
          <ReferralBanner />
        </>
      ) : (
        <>
          <TopDealsSection />
          <GroceryQuickLink />
          <LocationGate />
          <RecentlyViewedRail />
          <MembershipBanner />
          <ReferralBanner />
        </>
      )}

      {/* Compare USP CTA */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-6 text-white md:p-8">
        <p className="text-lg font-bold md:text-xl">Compare prices across nearby stores</p>
        <p className="mt-1 text-sm text-white/90">
          Search any product to instantly see which local store offers the best price.
        </p>
        <Link
          href="/search"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-white/90 btn-press"
        >
          Search products
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
