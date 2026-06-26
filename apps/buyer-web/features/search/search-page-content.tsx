'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/layout/site-shell';
import { SmartSearchSection } from '@/components/discovery/smart-search-section';
import { CategoryExplorer } from '@/components/discovery/category-explorer';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { CategoryFilter } from '@/features/categories/category-filter';
import { ProductCard } from '@/features/products/product-card';
import { StoreCardItem } from '@/features/stores/store-card';
import { useCategories, useUnifiedSearch } from '@/hooks/use-buyer-queries';
import { useDebounce } from '@/hooks/use-debounce';
import { useSearchHistory } from '@/hooks/use-search-history';
import { useEffectiveLocation } from '@/store/location-store';
import { resolveCollection } from '@/lib/search-collections';
import { SectionHeader } from '@/components/v2/section-header';
import type { UnifiedSearchProduct } from '@/types/buyer';

const TABS = ['all', 'products', 'stores', 'categories'] as const;
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

interface SearchPageContentProps {
  forcedDeals?: boolean;
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
  const [tab, setTab] = useState<(typeof TABS)[number]>('all');
  const [sort, setSort] = useState<string>('relevance');
  const { add: addHistory } = useSearchHistory();

  const qFromUrl = searchParams.get('q') ?? collection?.q ?? '';
  useEffect(() => {
    setQuery(qFromUrl);
  }, [qFromUrl]);

  const debouncedQuery = useDebounce(query, 400);

  const { data: categories = [] } = useCategories(storeIdParam ?? undefined);

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

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-jd-text-primary">
            {collection ? collection.title : 'Search & Discover'}
          </h1>
          <p className="mt-1 text-sm text-jd-text-muted">
            Nearby in-stock products from top-rated stores — ranked for your location
          </p>
        </div>

        <SmartSearchSection
          value={query}
          onChange={setQuery}
          onSubmit={(q) => router.replace(`/search?q=${encodeURIComponent(q)}`)}
          autoFocus
        />

        {showEmptyPrompt && (
          <>
            <section aria-labelledby="popular-cat">
              <SectionHeader title="Popular categories" />
              <CategoryExplorer categories={categories} />
            </section>
            <EmptyState
              variant="search"
              title="Start typing to search"
              description="Search products, stores, brands, and categories near you."
            />
          </>
        )}

        {!showEmptyPrompt && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1 rounded-xl bg-cream-2 p-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                    tab === t ? 'bg-card text-primary shadow-sm' : 'text-jd-text-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs"
              aria-label="Sort results"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <CategoryFilter categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
          </div>
        )}

        {!showEmptyPrompt && isLoading && <ProductGridSkeleton />}

        {!showEmptyPrompt && isError && (
          <ErrorState
            message={error instanceof Error ? error.message : 'Search failed'}
            onRetry={() => refetch()}
          />
        )}

        {!showEmptyPrompt && !isLoading && !isError && data && (
          <div className="space-y-8">
            {(tab === 'all' || tab === 'products') && data.products.length > 0 && (
              <section>
                <SectionHeader title="Products" subtitle={`${data.meta.totalProducts} results`} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {data.products.map((product) => (
                    <div key={product.id} className="relative">
                      {product.store.distanceKm != null && (
                        <span className="absolute right-2 top-2 z-10 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-medium text-jd-text-muted">
                          {product.store.distanceKm.toFixed(1)} km
                        </span>
                      )}
                      {product.store.hasOffer && (
                        <span className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                          Offer
                        </span>
                      )}
                      {!product.inStock && (
                        <span className="absolute bottom-16 left-2 z-10 rounded bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                          Low stock
                        </span>
                      )}
                      <ProductCard product={toProductCard(product)} showStore trackView />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(tab === 'all' || tab === 'stores') && data.stores.length > 0 && (
              <section>
                <SectionHeader title="Stores" />
                <div className="grid gap-3 sm:grid-cols-2">
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
                      className="rounded-full border px-4 py-2 text-sm hover:border-primary hover:text-primary"
                    >
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
                      className="rounded-full bg-cream-3 px-4 py-2 text-sm font-medium"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {data.products.length === 0 &&
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
      </div>
    </PageShell>
  );
}
