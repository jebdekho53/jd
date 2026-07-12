'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Crown,
  Gift,
  MapPin,
  PackageCheck,
  Scale,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';
import { CategoryExplorer, CategoryRail } from '@/components/discovery/category-explorer';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { SectionHeader } from '@/components/v2/section-header';
import { MembershipBanner, ReferralBanner } from '@/components/merchandising/home-banners';
import { RecentlyViewedRail } from '@/components/merchandising/recently-viewed-rail';
import { ProductCardSkeleton, StoreGridSkeleton } from '@/components/common/skeletons';
import { StoreCardItem } from '@/features/stores/store-card';
import { RestaurantCard } from '@/features/food/restaurant-card';
import { ProductCard } from '@/features/products/product-card';
import { VerticalNav } from '@/features/home/vertical-nav';
import { VerticalEntryCards } from '@/features/home/vertical-entry-cards';
import { SponsoredRail } from '@/features/home/sponsored-rail';
import { useCategories, useCategoryStores, useDiscoverStores, useProductSearch } from '@/hooks/use-buyer-queries';
import { useRestaurantsQuery } from '@/hooks/use-food-queries';
import { useEffectiveLocation } from '@/store/location-store';
import { TopDealsSection } from '@/features/promotions/top-deals-section';
import {
  FlashSalesSection,
  OffersNearYouSection,
} from '@/features/promotions/campaign-sections';
import type { CategoryItem } from '@/types/buyer';

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

function CategoryStoreSection({
  title,
  subtitle,
  categoryId,
  href,
  lat,
  lng,
  pincode,
}: {
  title: string;
  subtitle?: string;
  categoryId?: string;
  href: string;
  lat: number;
  lng: number;
  pincode?: string;
}) {
  const params = useMemo(
    () => ({ lat, lng, pincode, radiusKm: 20, page: 1, limit: 8, sort: 'distance' as const }),
    [lat, lng, pincode],
  );
  const { data, isLoading } = useCategoryStores(categoryId ?? '', params, Boolean(categoryId && lat && lng));
  const stores = data?.data ?? [];

  if (!categoryId) return null;
  if (!isLoading && stores.length === 0) return null;

  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} href={href} linkLabel="View all" />
      {isLoading ? (
        <StoreGridSkeleton count={3} />
      ) : (
        <HorizontalCarousel label={title} itemClassName="w-[260px] sm:w-[280px]">
          {stores.map((store) => (
            <StoreCardItem key={`category-${categoryId}-${store.id}`} store={store} variant="compact" productCount={store.productCount} />
          ))}
        </HorizontalCarousel>
      )}
    </section>
  );
}

function flattenCategories(categories: CategoryItem[]): CategoryItem[] {
  const result: CategoryItem[] = [];
  for (const category of categories) {
    result.push(category);
    if (category.children.length > 0) result.push(...flattenCategories(category.children));
  }
  return result;
}

function findCategory(categories: CategoryItem[], candidates: string[]) {
  const normalized = candidates.map((value) => value.toLowerCase());
  return categories.find((category) => {
    const slug = category.slug.toLowerCase();
    const name = category.name.toLowerCase();
    return normalized.some((candidate) => slug.includes(candidate) || name.includes(candidate));
  });
}

const VERTICAL_CATEGORY_MATCHERS: Record<string, string[]> = {
  grocery: ['grocery', 'groceries', 'staples', 'household', 'daily', 'essential'],
  bakery: ['bakery', 'bread', 'cake', 'pastry', 'cookies', 'brownie'],
  cafe: ['cafe', 'coffee', 'tea', 'shake', 'pasta', 'snack'],
  fresh: ['fresh', 'fruit', 'vegetable'],
  pet: ['pet', 'dog', 'cat'],
  electronics: ['electronics', 'mobile', 'appliance', 'accessories'],
  'home-appliances': ['electronics', 'appliance', 'home-electronics'],
  'personal-care': ['personal', 'beauty', 'care', 'hygiene'],
  health: ['health', 'supplement', 'nutrition'],
  meat: ['meat', 'fish', 'chicken', 'egg', 'mutton'],
  'meat-fish': ['meat', 'fish', 'chicken', 'egg', 'mutton'],
};

function normalizeVertical(value: string | null): string {
  return (value ?? 'grocery').trim().toLowerCase();
}

function categoryMatchesVertical(category: CategoryItem, vertical: string): boolean {
  if (vertical === 'grocery') return true;
  const matchers = VERTICAL_CATEGORY_MATCHERS[vertical] ?? [vertical];
  const haystack = `${category.name} ${category.slug}`.toLowerCase();
  return matchers.some((matcher) => haystack.includes(matcher));
}

function filterCategoriesByVertical(categories: CategoryItem[], vertical: string): CategoryItem[] {
  if (vertical === 'grocery') return categories;

  return categories
    .map((category) => {
      const children = filterCategoriesByVertical(category.children, vertical);
      if (categoryMatchesVertical(category, vertical) || children.length > 0) {
        return { ...category, children };
      }
      return null;
    })
    .filter((category): category is CategoryItem => category !== null);
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

function MarketplaceHero({
  categories,
  hasLocation,
  locationLabel,
}: {
  categories: CategoryItem[];
  hasLocation: boolean;
  locationLabel?: string;
}) {
  const chips = categories.slice(0, 6);

  return (
    <section className="grid gap-3 lg:grid-cols-[1.45fr_0.9fr]">
      <div className="overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-emerald-700 via-primary to-lime-600 p-5 text-white shadow-elevated md:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
              Local stores, better prices
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-5xl">
              Groceries from nearby sellers, compared before checkout.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/90 md:text-base">
              Search products, compare store prices, and order essentials from verified sellers around you.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:w-64">
            {[
              ['Compare', 'prices'],
              ['Verified', 'stores'],
              ['Fast', 'delivery'],
            ].map(([value, label]) => (
              <div key={value} className="rounded-2xl bg-white/14 px-2 py-3 backdrop-blur-sm">
                <p className="text-sm font-black">{value}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-white/75">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/search"
          className="mt-5 flex min-h-12 items-center gap-3 rounded-2xl bg-white px-4 text-sm font-semibold text-jd-text-primary shadow-card transition hover:bg-white/95"
        >
          <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1 text-left">Search milk, atta, snacks, fruits...</span>
          <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary sm:inline">
            Compare
          </span>
        </Link>

        {chips.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Quick category shortcuts">
            {chips.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="shrink-0 rounded-full bg-white/14 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/22"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <Link
          href="/stores"
          className="group rounded-3xl border border-border/60 bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-3 text-sm font-black text-jd-text-primary">
            {hasLocation ? `Delivering near ${locationLabel ?? 'you'}` : 'Set location for live stores'}
          </p>
          <p className="mt-1 text-xs leading-5 text-jd-text-muted">
            See only sellers that can deliver to your area.
          </p>
        </Link>
        <Link
          href="/compare"
          className="group rounded-3xl border border-border/60 bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-100 text-teal-700">
            <Scale className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-3 text-sm font-black text-jd-text-primary">Compare every cart</p>
          <p className="mt-1 text-xs leading-5 text-jd-text-muted">
            Choose the best store price before you buy.
          </p>
        </Link>
        <Link
          href="/products"
          className="group rounded-3xl border border-border/60 bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-3 text-sm font-black text-jd-text-primary">Browse full shelf</p>
          <p className="mt-1 text-xs leading-5 text-jd-text-muted">
            Product-first shopping across nearby stores.
          </p>
        </Link>
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

function ProductRail({
  title,
  subtitle,
  categoryId,
  categorySlug,
  sort,
  lat,
  lng,
  pincode,
}: {
  title: string;
  subtitle: string;
  categoryId?: string;
  categorySlug?: string;
  sort: 'distance' | 'price_low_high' | 'price_high_low' | 'rating' | 'fastest_delivery';
  lat: number;
  lng: number;
  pincode?: string;
}) {
  const params = useMemo(
    () => ({ categoryId, lat, lng, pincode, sort, page: 1, limit: 10 }),
    [categoryId, lat, lng, pincode, sort],
  );
  const { data, isLoading, isError } = useProductSearch(params, Boolean(categoryId && lat && lng));
  const products = data?.data ?? [];
  const href = categorySlug ? `/categories/${categorySlug}` : '/products';

  if (isError) return null;
  if (!isLoading && products.length === 0) return null;

  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} href={href} linkLabel="View all" />
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[152px] shrink-0 sm:w-[168px]">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <HorizontalCarousel label={title} itemClassName="w-[152px] sm:w-[168px]">
          {products.map((product) => (
            <ProductCard
              key={`${title}-${product.id}-${product.store.id}`}
              product={product}
              variant="carousel"
              showStore
              trackView
            />
          ))}
        </HorizontalCarousel>
      )}
    </section>
  );
}

function ProductShelves({
  categories,
  vertical,
  lat,
  lng,
  pincode,
}: {
  categories: CategoryItem[];
  vertical: string;
  lat: number;
  lng: number;
  pincode?: string;
}) {
  const flat = useMemo(() => flattenCategories(categories), [categories]);
  const verticalCategory = vertical === 'grocery' ? undefined : flat[0];
  const essentials = verticalCategory ?? findCategory(flat, ['grocery', 'staples', 'daily']);
  const fresh = vertical === 'grocery' ? findCategory(flat, ['fruit', 'vegetable', 'fresh']) : undefined;
  const dairy = vertical === 'grocery' ? findCategory(flat, ['dairy', 'bakery', 'milk']) : undefined;
  const snacks = vertical === 'grocery' ? findCategory(flat, ['snack', 'beverage', 'drink']) : undefined;

  const shelves = [
    essentials && {
      key: 'essentials',
      title: vertical === 'grocery' ? 'Daily essentials' : `${essentials.name} near you`,
      subtitle: vertical === 'grocery' ? 'Compare prices from local grocery shelves' : 'Only matching products from this vertical',
      category: essentials,
      sort: 'distance' as const,
    },
    fresh && {
      key: 'fresh',
      title: 'Fresh picks nearby',
      subtitle: 'Fruits, vegetables and morning basket items',
      category: fresh,
      sort: 'fastest_delivery' as const,
    },
    dairy && {
      key: 'dairy',
      title: 'Breakfast basket',
      subtitle: 'Dairy, bakery and quick morning needs',
      category: dairy,
      sort: 'distance' as const,
    },
    snacks && {
      key: 'snacks',
      title: 'Snacks & beverages',
      subtitle: 'Quick add-ons from nearby stores',
      category: snacks,
      sort: 'rating' as const,
    },
  ].filter(Boolean) as Array<{
    key: string;
    title: string;
    subtitle: string;
    category: CategoryItem;
    sort: 'distance' | 'price_low_high' | 'price_high_low' | 'rating' | 'fastest_delivery';
  }>;

  if (shelves.length === 0) return null;

  return (
    <>
      {shelves.map((shelf) => (
        <ProductRail
          key={shelf.key}
          title={shelf.title}
          subtitle={shelf.subtitle}
          categoryId={shelf.category.id}
          categorySlug={shelf.category.slug}
          sort={shelf.sort}
          lat={lat}
          lng={lng}
          pincode={pincode}
        />
      ))}
    </>
  );
}

function getPrimaryVerticalCategory(categories: CategoryItem[], vertical: string): CategoryItem | undefined {
  if (vertical === 'grocery') return undefined;
  return flattenCategories(categories)[0];
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
  const searchParams = useSearchParams();
  const selectedVertical = normalizeVertical(searchParams.get('vertical'));
  const { lat, lng, pincode, label, isReady } = useEffectiveLocation();
  const { data: categories = [] } = useCategories();
  const visibleCategories = useMemo(
    () => filterCategoriesByVertical(categories, selectedVertical),
    [categories, selectedVertical],
  );
  const primaryVerticalCategory = useMemo(
    () => getPrimaryVerticalCategory(visibleCategories, selectedVertical),
    [visibleCategories, selectedVertical],
  );
  const hasLocation = isReady && lat != null && lng != null;
  const isFoodVertical = selectedVertical === 'food';

  return (
    <div className="space-y-5 animate-fade-in md:space-y-8">
      <VerticalNav className="-mx-4 px-4 md:-mx-1 md:px-1" />
      <MarketplaceHero categories={visibleCategories} hasLocation={hasLocation} locationLabel={label} />
      {!isFoodVertical && <VerticalEntryCards />}

      {/* Quick categories — top priority on mobile */}
      {!isFoodVertical && (
        <section aria-labelledby="quick-cats">
        <SectionHeader
          title={selectedVertical === 'grocery' ? 'Shop by category' : `Shop ${selectedVertical.replace(/-/g, ' ')}`}
          href="/categories"
          linkLabel="All categories"
        />
        <CategoryRail categories={visibleCategories} className="md:hidden" />
        <CategoryExplorer categories={visibleCategories} className="hidden md:grid" />
        </section>
      )}

      {/* Sponsored (paid) product placements — renders nothing when no active ads */}
      <SponsoredRail />

      {hasLocation ? (
        <>
          {isFoodVertical ? (
            <>
              <FoodSection lat={lat!} lng={lng!} pincode={pincode} />
              <CommerceCtas />
            </>
          ) : (
            <>
              <ProductShelves categories={visibleCategories} vertical={selectedVertical} lat={lat!} lng={lng!} pincode={pincode} />
              {selectedVertical === 'grocery' ? (
                <StoreSection title="Nearby stores" subtitle="Delivering to your location" sort="distance" href="/stores" lat={lat!} lng={lng!} pincode={pincode} />
              ) : (
                <CategoryStoreSection
                  title={`${selectedVertical.replace(/-/g, ' ')} stores`}
                  subtitle="Only stores matching this vertical"
                  categoryId={primaryVerticalCategory?.id}
                  href={primaryVerticalCategory ? `/categories/${primaryVerticalCategory.slug}` : '/categories'}
                  lat={lat!}
                  lng={lng!}
                  pincode={pincode}
                />
              )}
              <TopDealsSection />
              <FlashSalesSection />
              <OffersNearYouSection />
              {selectedVertical === 'grocery' && <FoodSection lat={lat!} lng={lng!} pincode={pincode} />}
              {selectedVertical === 'grocery' && <StoreSection title="Popular stores" subtitle="Most loved in your area" sort="popular" href="/stores?sort=popular" lat={lat!} lng={lng!} pincode={pincode} />}
              <RecentlyViewedRail />
              <SocialProofStrip />
              <CommerceCtas />
              <MembershipBanner />
              {selectedVertical === 'grocery' && <StoreSection title="New on JebDekho" subtitle="Recently joined stores" sort="new" href="/stores?sort=new" lat={lat!} lng={lng!} pincode={pincode} />}
              <ReferralBanner />
            </>
          )}
        </>
      ) : (
        <>
          {!isFoodVertical && <TopDealsSection />}
          {!isFoodVertical && <FlashSalesSection />}
          {isFoodVertical ? <GroceryQuickLink /> : selectedVertical === 'grocery' && <GroceryQuickLink />}
          <LocationGate />
          <RecentlyViewedRail />
          <SocialProofStrip />
          <CommerceCtas />
          <MembershipBanner />
          <ReferralBanner />
        </>
      )}

      {/* Compare USP CTA */}
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-primary to-secondary p-6 text-white shadow-elevated md:p-8">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
          <PackageCheck className="h-6 w-6" aria-hidden />
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
