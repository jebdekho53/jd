'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BadgePercent,
  Crown,
  Gift,
  MapPin,
  Scale,
  ShieldCheck,
  Store,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';
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

const PROOF_POINTS = [
  { label: 'Verified local stores', icon: BadgeCheck },
  { label: 'Secure payments', icon: ShieldCheck },
  { label: 'Price comparison', icon: Scale },
  { label: 'Fast delivery', icon: Truck },
];

function SocialProofStrip() {
  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Why shop on JebDekho">
      {PROOF_POINTS.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-3 shadow-card"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-bold leading-tight text-jd-text-primary">{label}</span>
        </div>
      ))}
    </section>
  );
}

function CommerceCtas() {
  const cards = [
    {
      title: 'JebDekho Plus',
      text: 'Unlock free delivery and member-only savings.',
      href: '/plus',
      icon: Crown,
      className: 'border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700',
    },
    {
      title: 'Refer & earn',
      text: 'Invite friends and earn wallet credits.',
      href: '/profile/referrals',
      icon: Gift,
      className: 'border-primary/20 bg-gradient-to-br from-primary/10 to-emerald-50 text-primary',
    },
    {
      title: 'Compare prices',
      text: 'Find the lowest nearby price before checkout.',
      href: '/compare',
      icon: Scale,
      className: 'border-teal-200/70 bg-gradient-to-br from-teal-50 to-lime-50 text-teal-700',
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {cards.map(({ title, text, href, icon: Icon, className }) => (
        <Link
          key={title}
          href={href}
          className={`group flex min-h-[116px] items-start gap-3 rounded-3xl border p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/80 shadow-card">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black text-jd-text-primary">{title}</span>
            <span className="mt-1 block text-xs leading-5 text-jd-text-muted">{text}</span>
          </span>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      ))}
    </section>
  );
}

function TrendingOffersPreview() {
  return (
    <section>
      <SectionHeader title="Trending offers" subtitle="Fresh deals from nearby sellers" href="/offers" linkLabel="View all" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Daily essentials', 'Up to 25% off', 'Compare staples'],
          ['Fresh breakfast', 'Milk, bread & fruits', 'Shop morning picks'],
          ['Weekend stock-up', 'Snacks and beverages', 'Explore deals'],
        ].map(([title, subtitle, cta]) => (
          <Link
            key={title}
            href="/offers"
            className="group overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-white to-primary/5 p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-jd-text-primary">{title}</p>
                <p className="mt-1 text-xs text-jd-text-muted">{subtitle}</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <BadgePercent className="h-5 w-5" aria-hidden />
              </span>
            </div>
            <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
              {cta}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
            </p>
          </Link>
        ))}
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
    <div className="space-y-6 animate-fade-in md:space-y-10">
      <VerticalNav className="-mx-4 px-4 md:-mx-1 md:px-1" />
      <HeroCarousel />
      <SocialProofStrip />

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

      <TrendingOffersPreview />
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
          <CommerceCtas />
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
          <CommerceCtas />
          <MembershipBanner />
          <ReferralBanner />
        </>
      )}

      {/* Compare USP CTA */}
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-primary to-secondary p-6 text-white shadow-elevated md:p-8">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
          <Store className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-xl font-black md:text-2xl">Compare prices across nearby stores</p>
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
