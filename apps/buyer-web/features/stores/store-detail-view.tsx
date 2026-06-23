'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Star, Truck } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryFilter } from '@/features/categories/category-filter';
import { ProductCard } from '@/features/products/product-card';
import { useStore, useStoreProducts } from '@/hooks/use-buyer-queries';
import { formatCurrency, formatDistance } from '@/lib/utils';

interface StoreDetailViewProps {
  slug: string;
}

export function StoreDetailView({ slug }: StoreDetailViewProps) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: store, isLoading: storeLoading, isError: storeError, error, refetch } = useStore(slug);

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
    isFetching,
  } = useStoreProducts(slug, { categoryId: categoryId ?? undefined, page, limit: 20 });

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

        <div className="relative overflow-hidden rounded-2xl border">
          <div className="relative h-40 bg-muted md:h-52">
            {store.bannerUrl ? (
              <Image src={store.bannerUrl} alt="" fill className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-5xl font-bold text-primary/20">
                {store.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{store.name}</h1>
                  <Badge variant={store.isOpen ? 'success' : 'warning'}>
                    {store.isOpen ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" aria-hidden />
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

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                {store.ratingAvg.toFixed(1)} ({store.ratingCount} reviews)
              </span>
              <span>{formatDistance(store.distanceKm)}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden />
                {store.avgPrepTimeMins} min prep
              </span>
              <span className="inline-flex items-center gap-1">
                <Truck className="h-4 w-4" aria-hidden />
                {store.deliveryFee === 0 ? 'Free delivery' : formatCurrency(store.deliveryFee)}
              </span>
            </div>
          </div>
        </div>

        <section aria-labelledby="products-heading">
          <h2 id="products-heading" className="mb-4 text-lg font-semibold">
            Products ({store.productCount})
          </h2>

          <CategoryFilter
            categories={store.categories.map((c) => ({
              ...c,
              imageUrl: null,
              parentId: null,
              sortOrder: 0,
              children: [],
            }))}
            selectedId={categoryId}
            onSelect={(id) => {
              setCategoryId(id);
              setPage(1);
            }}
          />

          {productsLoading && <ProductGridSkeleton />}

          {productsError && (
            <ErrorState onRetry={() => refetchProducts()} />
          )}

          {!productsLoading && !productsError && productsData?.data.length === 0 && (
            <EmptyState
              title="No products available"
              description="This store has no in-stock products in this category right now."
            />
          )}

          {!productsLoading && !productsError && productsData && productsData.data.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {productsData.data.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {productsData.meta.page < productsData.meta.totalPages && (
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
      </div>
    </PageShell>
  );
}
