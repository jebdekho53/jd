'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Search, ShoppingBag, Star, Truck } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { DeliveryBadge } from '@/components/v2/delivery-badge';
import { PromoBanner } from '@/components/v2/promo-banner';
import { SectionHeader } from '@/components/v2/section-header';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryFilter } from '@/features/categories/category-filter';
import { ProductCard } from '@/features/products/product-card';
import { useStore, useStoreProducts, useCategories } from '@/hooks/use-buyer-queries';
import { StoreReviewsSection } from '@/features/reviews/store-reviews-section';
import { StoreOffersSection } from '@/features/promotions/store-offers-section';
import { formatCurrency, formatDistance } from '@/lib/utils';

interface StoreDetailViewProps {
  slug: string;
}

export function StoreDetailView({ slug }: StoreDetailViewProps) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [storeQuery, setStoreQuery] = useState('');
  const [sort, setSort] = useState<'default' | 'price-asc' | 'price-desc'>('default');

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
        <Skeleton className="h-48 w-full rounded-2xl" />
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

  return (
    <PageShell>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link href="/stores">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to stores
          </Link>
        </Button>

        {/* Store hero */}
        <article className="overflow-hidden rounded-2xl border bg-card">
          <div className="relative h-44 bg-brand-100 md:h-52">
            {store.bannerUrl ? (
              <Image src={store.bannerUrl} alt="" fill className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 text-5xl font-bold text-primary/20">
                {store.name.charAt(0)}
              </div>
            )}
            <div className="absolute left-4 top-4 flex gap-2">
              <Badge variant={store.isOpen ? 'success' : 'warning'}>
                {store.isOpen ? 'Open' : 'Closed'}
              </Badge>
              <DeliveryBadge minutes={store.avgPrepTimeMins} className="bg-card/95" />
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{store.name}</h1>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  {store.address.line1}, {store.address.pincode}
                </p>
              </div>
              {store.logoUrl && (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border">
                  <Image src={store.logoUrl} alt="" fill className="object-cover" />
                </div>
              )}
            </div>

            {store.description && (
              <p className="mt-3 text-sm text-muted-foreground">{store.description}</p>
            )}

            {store.verifications && (
              <div className="mt-3 flex flex-wrap gap-2">
                {store.verifications.gst && <Badge variant="secondary">GST verified</Badge>}
                {store.verifications.kyc && <Badge variant="secondary">KYC verified</Badge>}
                {store.verifications.fssai && <Badge variant="secondary">FSSAI verified</Badge>}
                {store.merchantSince && (
                  <Badge variant="outline">
                    Merchant since {new Date(store.merchantSince).getFullYear()}
                  </Badge>
                )}
                {store.deliveryRadiusKm != null && (
                  <Badge variant="outline">Delivery radius {store.deliveryRadiusKm} km</Badge>
                )}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:flex sm:flex-wrap sm:gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                {store.ratingAvg.toFixed(1)} ({store.ratingCount} reviews)
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden />
                {formatDistance(store.distanceKm)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" aria-hidden />
                {store.avgPrepTimeMins} min delivery
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Truck className="h-4 w-4" aria-hidden />
                {store.deliveryFee === 0 ? 'Free delivery' : formatCurrency(store.deliveryFee)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground col-span-2 sm:col-span-1">
                <ShoppingBag className="h-4 w-4" aria-hidden />
                Min order {formatCurrency(store.minOrderAmount)}
              </span>
            </div>
          </div>
        </article>

        <PromoBanner
          title={`Order from ${store.name}`}
          description="Add items to cart and checkout in under a minute."
          cta="View cart"
          href="/cart"
          variant="neutral"
        />

        <section aria-labelledby="products-heading">
          <SectionHeader
            title="Menu"
            subtitle={`${store.productCount} products available`}
          />

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" aria-hidden />
              <input
                type="search"
                value={storeQuery}
                onChange={(e) => setStoreQuery(e.target.value)}
                placeholder="Search in this store…"
                className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="Search products in store"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-11 rounded-xl border border-border/60 bg-card px-3 text-sm outline-none focus:border-primary"
              aria-label="Sort products"
            >
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
            </select>
          </div>

          <CategoryFilter
            categories={storeCategories}
            selectedId={categoryId}
            onSelect={(id) => {
              setCategoryId(id);
              setPage(1);
            }}
          />

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
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeId={store.id}
                    trackView
                  />
                ))}
              </div>

              {productsData && productsData.meta.page < productsData.meta.totalPages && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                  >
                    {isFetching ? 'Loading…' : 'Load more products'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        <StoreOffersSection storeSlug={slug} />
        <StoreReviewsSection storeSlug={slug} />
      </div>
    </PageShell>
  );
}
