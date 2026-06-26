'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, SlidersHorizontal, Store, Tag } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { SmartSearchSection } from '@/components/discovery/smart-search-section';
import { CategoryExplorer } from '@/components/discovery/category-explorer';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { ProductCard } from '@/features/products/product-card';
import { StoreCardItem } from '@/features/stores/store-card';
import { BottomSheet, Chip, SegmentedControl } from '@/design-system/primitives';
import { useCategories, useUnifiedSearch } from '@/hooks/use-buyer-queries';
import { useDebounce } from '@/hooks/use-debounce';
import { useSearchHistory } from '@/hooks/use-search-history';
import { useEffectiveLocation } from '@/store/location-store';
import { resolveCollection } from '@/lib/search-collections';
import { SectionHeader } from '@/components/v2/section-header';
import { cn } from '@/lib/utils';
import type { UnifiedSearchProduct } from '@/types/buyer';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'products', label: 'Products' },
  { value: 'stores', label: 'Stores' },
  { value: 'categories', label: 'Categories' },
] as const;

const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'distance', label: 'Nearest' },
  { value: 'price_low_high', label: 'Price: Low to High' },
  { value: 'price_high_low', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'fastest_delivery', label: 'Fastest delivery' },
] as const;

function toProductCard(p: UnifiedSearchProduct) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: null,
    brand: p.brand,
    imageUrls: p.imageUrls,
    basePrice: p.basePrice,
    mrp: p.mrp,
    unit: 'piece',
    isVeg: null,
    tags: [],
    category: p.category,
    variants: [
      {
        id: `${p.id}-default`,
        name: 'Default',
        price: p.basePrice,
        mrp: p.mrp,
        weightGrams: null,
        isDefault: true,
        availableQty: p.availableQty,
      },
    ],
    store: p.store,
  };
}

function isDeal(p: UnifiedSearchProduct): boolean {
  return Boolean(p.store.hasOffer || (p.mrp != null && p.mrp > p.basePrice));
}

interface SearchPageContentProps {
  forcedDeals?: boolean;
}

function flattenCategories<T extends { id: string; name: string; children: T[] }>(
  categories: T[],
): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = [];
  for (const c of categories) {
    out.push({ id: c.id, name: c.name });
    if (c.children?.length) out.push(...flattenCategories(c.children));
  }
  return out;
}

export function SearchPageContent({ forcedDeals = false }: SearchPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lat, lng, pincode } = useEffectiveLocation();
  const storeIdParam = searchParams.get('storeId');
  const initialCategory = searchParams.get('categoryId');
  const collectionParam = searchParams.get('collection');
  const collection = resolveCollection(collectionParam);
  const initialQuery = searchParams.get('q') ?? collection?.q ?? '';

  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState<string | null>(initialCategory);
  const [tab, setTab] = useState<(typeof TABS)[number]['value']>('all');
  const [sort, setSort] = useState<string>(forcedDeals ? 'price_low_high' : 'relevance');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { add: addHistory } = useSearchHistory();

  const qFromUrl = searchParams.get('q') ?? collection?.q ?? '';
  useEffect(() => {
    setQuery(qFromUrl);
  }, [qFromUrl]);

  const debouncedQuery = useDebounce(query, 400);

  const { data: categories = [] } = useCategories(storeIdParam ?? undefined);
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const activeCategoryName = flatCategories.find((c) => c.id === categoryId)?.name;

  const searchParams_ = useMemo(
    () => ({
      q: debouncedQuery.trim() || undefined,
      categoryId: categoryId ?? undefined,
      storeId: storeIdParam ?? undefined,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      pincode: pincode ?? undefined,
      sort,
      tab,
      page: 1,
      limit: 24,
    }),
    [debouncedQuery, categoryId, storeIdParam, lat, lng, pincode, sort, tab],
  );

  const canSearch = debouncedQuery.trim().length >= 2 || Boolean(categoryId);

  const { data, isLoading, isError, error, refetch } = useUnifiedSearch(searchParams_, canSearch);

  useEffect(() => {
    if (canSearch && debouncedQuery.trim().length >= 2) {
      addHistory(debouncedQuery.trim());
    }
  }, [data, canSearch, debouncedQuery, addHistory]);

  const showEmptyPrompt = !canSearch;

  const products = useMemo(() => {
    const list = data?.products ?? [];
    return forcedDeals ? list.filter(isDeal) : list;
  }, [data?.products, forcedDeals]);

  const sortActive = sort !== (forcedDeals ? 'price_low_high' : 'relevance');
  const filterCount = (categoryId ? 1 : 0) + (sortActive ? 1 : 0);

  const heading = forcedDeals ? 'Deals & offers' : collection ? collection.title : 'Search & Discover';
  const subheading = forcedDeals
    ? 'Best discounts and offers from stores near you'
    : 'Nearby in-stock products from top-rated stores — ranked for your location';

  return (
    <PageShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">{heading}</h1>
          <p className="mt-1 text-sm text-jd-text-muted">{subheading}</p>
        </div>

        <SmartSearchSection
          value={query}
          onChange={setQuery}
          onSubmit={(q) => router.replace(`/search?q=${encodeURIComponent(q)}`)}
          autoFocus={!forcedDeals}
        />

        {showEmptyPrompt && (
          <>
            <section aria-labelledby="popular-cat">
              <SectionHeader title="Popular categories" />
              <CategoryExplorer categories={categories} />
            </section>
            <EmptyState
              variant="search"
              title={forcedDeals ? 'Find the best deals' : 'Start typing to search'}
              description={
                forcedDeals
                  ? 'Search a product to compare discounted prices across nearby stores.'
                  : 'Search products, stores, brands, and categories near you.'
              }
            />
          </>
        )}

        {!showEmptyPrompt && (
          <>
            {/* Controls: tabs + filters */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 overflow-x-auto scrollbar-none">
                  <SegmentedControl
                    options={TABS}
                    value={tab}
                    onChange={(v) => setTab(v)}
                    size="sm"
                    aria-label="Result type"
                    className="min-w-[300px]"
                  />
                </div>
                <Chip
                  size="sm"
                  active={filterCount > 0}
                  leadingIcon={<SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />}
                  onClick={() => setFiltersOpen(true)}
                >
                  {filterCount > 0 ? `Filters (${filterCount})` : 'Filters'}
                </Chip>
              </div>

              {/* Quick category chips */}
              {flatCategories.length > 0 && (tab === 'all' || tab === 'products') && (
                <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-none">
                  <Chip size="sm" active={categoryId === null} onClick={() => setCategoryId(null)}>
                    All
                  </Chip>
                  {flatCategories.slice(0, 12).map((c) => (
                    <Chip
                      key={c.id}
                      size="sm"
                      active={categoryId === c.id}
                      onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
                    >
                      {c.name}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            {isLoading && <ProductGridSkeleton />}

            {isError && (
              <ErrorState
                message={error instanceof Error ? error.message : 'Search failed'}
                onRetry={() => refetch()}
              />
            )}

            {!isLoading && !isError && data && (
              <div className="space-y-8">
                {(tab === 'all' || tab === 'products') && products.length > 0 && (
                  <section>
                    <SectionHeader
                      title="Products"
                      subtitle={`${products.length}${forcedDeals ? ' deals' : ' results'}${
                        activeCategoryName ? ` in ${activeCategoryName}` : ''
                      }`}
                    />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={toProductCard(product)}
                          showStore
                          trackView
                        />
                      ))}
                    </div>
                  </section>
                )}

                {(tab === 'all' || tab === 'stores') && data.stores.length > 0 && (
                  <section>
                    <SectionHeader title="Stores" />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {data.stores.map((store) => (
                        <StoreCardItem
                          key={store.id}
                          store={{
                            id: store.id,
                            name: store.name,
                            slug: store.slug,
                            logoUrl: store.logoUrl,
                            bannerUrl: store.bannerUrl,
                            description: null,
                            address: { line1: '', line2: null, pincode: '' },
                            ratingAvg: store.ratingAvg,
                            ratingCount: 0,
                            deliveryFee: 0,
                            minOrderAmount: 0,
                            avgPrepTimeMins: store.etaMins,
                            distanceKm: store.distanceKm,
                            isOpen: true,
                            todayHours: null,
                          }}
                          variant="compact"
                        />
                      ))}
                    </div>
                  </section>
                )}

                {(tab === 'all' || tab === 'categories') && data.categories.length > 0 && (
                  <section>
                    <SectionHeader title="Categories" />
                    <div className="flex flex-wrap gap-2">
                      {data.categories.map((c) => (
                        <Link
                          key={c.id}
                          href={`/search?categoryId=${c.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
                        >
                          <Tag className="h-3.5 w-3.5" aria-hidden />
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {tab === 'all' && data.brands.length > 0 && (
                  <section>
                    <SectionHeader title="Brands" />
                    <div className="flex flex-wrap gap-2">
                      {data.brands.map((b) => (
                        <Link
                          key={b.name}
                          href={`/search?q=${encodeURIComponent(b.name)}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 hover:text-primary"
                        >
                          <Store className="h-3.5 w-3.5" aria-hidden />
                          {b.name}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {products.length === 0 &&
                  data.stores.length === 0 &&
                  data.categories.length === 0 && (
                    <EmptyState
                      variant="search"
                      title="No results found"
                      description={`Nothing matched "${debouncedQuery}". Try a different term or browse categories.`}
                    />
                  )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sort & filters bottom sheet */}
      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Sort & filters"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setCategoryId(null);
                setSort(forcedDeals ? 'price_low_high' : 'relevance');
              }}
              className="h-11 flex-1 rounded-xl border border-border text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="h-11 flex-[2] rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-secondary btn-press"
            >
              Show results
            </button>
          </div>
        }
      >
        <div className="space-y-6 pb-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-jd-text-muted">
              Sort by
            </p>
            <div className="space-y-1">
              {SORTS.map((s) => {
                const active = sort === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSort(s.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition',
                      active ? 'bg-primary/5 font-semibold text-primary' : 'hover:bg-muted',
                    )}
                  >
                    {s.label}
                    {active && <Check className="h-4 w-4" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </div>

          {flatCategories.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-jd-text-muted">
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                <Chip active={categoryId === null} onClick={() => setCategoryId(null)}>
                  All categories
                </Chip>
                {flatCategories.map((c) => (
                  <Chip
                    key={c.id}
                    active={categoryId === c.id}
                    onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
                  >
                    {c.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </PageShell>
  );
}
