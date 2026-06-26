'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, Clock, MapPin, Search, ShoppingBag, SlidersHorizontal, Star, Truck } from 'lucide-react';
import { RecentStoreTracker } from '@/components/pwa/recent-store-tracker';
import { PageShell } from '@/components/layout/site-shell';
import { DeliveryBadge } from '@/components/v2/delivery-badge';
import { SectionHeader } from '@/components/v2/section-header';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryFilter } from '@/features/categories/category-filter';
import { ProductCard } from '@/features/products/product-card';
import { BottomSheet, Chip } from '@/design-system/primitives';
import { useStore, useStoreProducts, useCategories } from '@/hooks/use-buyer-queries';
import { StoreReviewsSection } from '@/features/reviews/store-reviews-section';
import { StoreOffersSection } from '@/features/promotions/store-offers-section';
import { formatCurrency, formatDistance, cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low to high' },
  { value: 'price-desc', label: 'Price: High to low' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

interface StoreDetailViewProps {
  slug: string;
}

export function StoreDetailView({ slug }: StoreDetailViewProps) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [storeQuery, setStoreQuery] = useState('');
  const [sort, setSort] = useState<SortValue>('default');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: store, isLoading: storeLoading, isError: storeError, error, refetch } = useStore(slug);
  const { data: storeCategories = [] } = useCategories(store?.id);

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
    isFetching,
  } = useStoreProducts(slug, { categoryId: categoryId ?? undefined, page, limit: 20 });

  const displayedProducts = useMemo(() => {
    if (!productsData?.data) return [];
    let list = productsData.data;
    if (storeQuery.trim()) {
      const q = storeQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (sort === 'price-asc' || sort === 'price-desc') {
      list = [...list].sort((a, b) => {
        const pa = a.variants.find((v) => v.isDefault)?.price ?? a.basePrice;
        const pb = b.variants.find((v) => v.isDefault)?.price ?? b.basePrice;
        return sort === 'price-asc' ? pa - pb : pb - pa;
      });
    }
    return list;
  }, [productsData?.data, storeQuery, sort]);

  if (storeLoading) {
    return (
      <PageShell>
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-6 w-1/2" />
        <ProductGridSkeleton />
      </PageShell>
    );
  }

  if (storeError || !store) {
    return (
      <PageShell>
        <ErrorState
          title="Store not found"
          message={error instanceof Error ? error.message : 'This store may be unavailable.'}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const sortActive = sort !== 'default';
  const filterCount = (categoryId ? 1 : 0) + (sortActive ? 1 : 0);

  return (
    <PageShell>
      <RecentStoreTracker
        id={store.id}
        name={store.name}
        slug={store.slug}
        imageUrl={store.logoUrl}
      />
      <div className="space-y-5 pb-4">
        {/* Mobile back */}
        <Link
          href="/stores"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-jd-text-muted hover:text-primary md:hidden"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Stores
        </Link>

        {/* Store hero */}
        <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <div className="relative h-36 bg-cream-3 md:h-48">
            {store.bannerUrl ? (
              <Image src={store.bannerUrl} alt="" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 text-5xl font-bold text-primary/20">
                {store.name.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute left-3 top-3 flex gap-2 md:left-4 md:top-4">
              <Badge variant={store.isOpen ? 'success' : 'warning'}>
                {store.isOpen ? 'Open' : 'Closed'}
              </Badge>
              <DeliveryBadge minutes={store.avgPrepTimeMins} className="bg-card/95" />
            </div>
            <Button variant="ghost" size="sm" asChild className="absolute right-2 top-2 hidden bg-card/80 backdrop-blur md:inline-flex">
              <Link href="/stores">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back
              </Link>
            </Button>
          </div>

          <div className="relative px-4 pb-5 pt-0 md:px-6 md:pb-6">
            <div className="-mt-10 flex items-end gap-3 md:-mt-12">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-cream-3 shadow-pop md:h-24 md:w-24">
                {store.logoUrl ? (
                  <Image src={store.logoUrl} alt="" fill className="object-cover" sizes="96px" />
                ) : (
                  <span className="flex h-full items-center justify-center text-2xl font-bold text-primary/30">
                    {store.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <h1 className="line-clamp-2 text-xl font-bold text-jd-text-primary md:text-2xl">{store.name}</h1>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-jd-text-muted md:text-sm">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{store.address.line1}</span>
                </p>
              </div>
            </div>

            {store.description && (
              <p className="mt-3 line-clamp-2 text-sm text-jd-text-muted md:line-clamp-none">{store.description}</p>
            )}

            {store.verifications && (
              <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
                {store.verifications.gst && <Badge variant="secondary">GST</Badge>}
                {store.verifications.kyc && <Badge variant="secondary">KYC</Badge>}
                {store.verifications.fssai && <Badge variant="secondary">FSSAI</Badge>}
                {store.merchantSince && (
                  <Badge variant="outline">Since {new Date(store.merchantSince).getFullYear()}</Badge>
                )}
              </div>
            )}

            {/* Stats — horizontal scroll on mobile */}
            <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              {[
                { icon: Star, label: `${store.ratingAvg.toFixed(1)} (${store.ratingCount})`, highlight: true },
                { icon: MapPin, label: formatDistance(store.distanceKm) },
                { icon: Clock, label: `${store.avgPrepTimeMins} min` },
                { icon: Truck, label: store.deliveryFee === 0 ? 'Free delivery' : formatCurrency(store.deliveryFee) },
                { icon: ShoppingBag, label: `Min ${formatCurrency(store.minOrderAmount)}` },
              ].map(({ icon: Icon, label, highlight }) => (
                <span
                  key={label}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
                    highlight ? 'border-primary/20 bg-primary/5 text-primary' : 'border-border bg-muted/50 text-jd-text-muted',
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', highlight && 'fill-amber-400 text-amber-400')} aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </article>

        <StoreOffersSection storeSlug={slug} />

        {/* Menu */}
        <section aria-labelledby="products-heading">
          <SectionHeader title="Menu" subtitle={`${store.productCount} products`} />

          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" aria-hidden />
                <input
                  type="search"
                  value={storeQuery}
                  onChange={(e) => setStoreQuery(e.target.value)}
                  placeholder="Search in store…"
                  className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  aria-label="Search products in store"
                />
              </div>
              <Chip
                size="md"
                active={filterCount > 0}
                leadingIcon={<SlidersHorizontal className="h-4 w-4" aria-hidden />}
                onClick={() => setFiltersOpen(true)}
                className="shrink-0"
              >
                {filterCount > 0 ? filterCount : 'Sort'}
              </Chip>
            </div>
            <CategoryFilter
              categories={storeCategories}
              selectedId={categoryId}
              onSelect={(id) => {
                setCategoryId(id);
                setPage(1);
              }}
            />
          </div>

          {productsLoading && <ProductGridSkeleton />}
          {productsError && <ErrorState onRetry={() => refetchProducts()} />}

          {!productsLoading && !productsError && displayedProducts.length === 0 && (
            <EmptyState
              variant="store"
              title={storeQuery ? 'No matching products' : 'No products available'}
              description={
                storeQuery
                  ? `No results for "${storeQuery}" in this store.`
                  : 'This store has no in-stock products in this category right now.'
              }
            />
          )}

          {!productsLoading && !productsError && displayedProducts.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} storeId={store.id} trackView />
                ))}
              </div>
              {productsData && productsData.meta.page < productsData.meta.totalPages && (
                <div className="mt-6 flex justify-center">
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={isFetching}>
                    {isFetching ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        <StoreReviewsSection storeSlug={slug} />
      </div>

      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Sort & filter"
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground btn-press"
          >
            Apply
          </button>
        }
      >
        <div className="space-y-4 pb-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-jd-text-muted">Sort by</p>
            <div className="space-y-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSort(opt.value)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition',
                    sort === opt.value ? 'bg-primary/5 font-semibold text-primary' : 'hover:bg-muted',
                  )}
                >
                  {opt.label}
                  {sort === opt.value && <Check className="h-4 w-4" aria-hidden />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </PageShell>
  );
}
