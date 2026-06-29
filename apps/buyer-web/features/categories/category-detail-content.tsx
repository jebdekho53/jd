'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton, StoreGridSkeleton } from '@/components/common/skeletons';
import { CategoryExplorer, CategoryRail } from '@/components/discovery/category-explorer';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { SectionHeader } from '@/components/v2/section-header';
import { ProductCard } from '@/features/products/product-card';
import { StoreCardItem } from '@/features/stores/store-card';
import { useCategories, useCategoryStores, useStoreProducts } from '@/hooks/use-buyer-queries';
import { resolveCategorySlug, flattenCategories } from '@/lib/categories';
import type { StoreCardWithCount } from '@/types/buyer';
import { useEffectiveLocation } from '@/store/location-store';

export function CategoryDetailContent({ slug }: { slug: string }) {
  const { lat, lng, pincode, label, isReady } = useEffectiveLocation();
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const category = useMemo(() => resolveCategorySlug(categories, slug), [categories, slug]);

  const flat = flattenCategories(categories);
  const apiCategory = flat.find((c) => c.slug === category.slug || c.id === category.id);

  const storeParams = useMemo(
    () =>
      lat != null && lng != null
        ? { lat, lng, pincode, radiusKm: 20, page: 1, limit: 12, sort: 'distance' as const }
        : null,
    [lat, lng, pincode],
  );

  const {
    data: storesData,
    isLoading: storesLoading,
    isError,
    error,
    refetch,
  } = useCategoryStores(
    apiCategory?.id ?? '',
    storeParams ?? { lat: 0, lng: 0, radiusKm: 20, page: 1, limit: 12, sort: 'distance' as const },
    Boolean(apiCategory?.id && isReady && storeParams),
  );

  const stores = storesData?.data ?? [];

  const subcategories = useMemo(() => {
    const found = flattenCategories(categories).find((c) => c.slug === category.slug);
    return found?.children ?? [];
  }, [categories, category.slug]);

  return (
    <PageShell>
      <div className="space-y-6">
        <nav className="hidden text-xs text-jd-text-muted md:block" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary">Home</Link>
          {' / '}
          <Link href="/categories" className="hover:text-primary">Categories</Link>
          {' / '}
          <span className="text-jd-text-primary">{category.name}</span>
        </nav>

        <header className="rounded-3xl border border-border bg-gradient-to-br from-primary/8 to-secondary/8 p-5 md:p-8">
          <Link href="/categories" className="text-xs font-medium text-primary hover:underline md:hidden">
            ← All categories
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-jd-text-primary md:mt-0 md:text-3xl">
            {category.name}
          </h1>
          {isReady && (
            <p className="mt-2 flex items-center gap-1 text-sm text-jd-text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              Stores near {label}
            </p>
          )}
        </header>

        {subcategories.length > 0 && (
          <section aria-labelledby="subcat-heading">
            <SectionHeader title="Subcategories" />
            <CategoryRail categories={subcategories} className="md:hidden" />
            <CategoryExplorer categories={subcategories} className="hidden md:grid" />
          </section>
        )}

        <section aria-labelledby="stores-heading">
          <SectionHeader
            title={`Stores selling ${category.name}`}
            subtitle={stores.length > 0 ? `${stores.length} nearby` : undefined}
          />

          {(storesLoading || catLoading) && <StoreGridSkeleton count={3} />}
          {isError && (
            <ErrorState
              message={error instanceof Error ? error.message : 'Failed to load stores'}
              onRetry={() => refetch()}
            />
          )}
          {!lat || !lng ? (
            <EmptyState
              variant="search"
              title="Set your location"
              description="Choose a delivery location to see stores in this category."
            />
          ) : !storesLoading && !isError && stores.length === 0 ? (
            <EmptyState
              variant="search"
              title="No stores found"
              description="No approved stores in this category deliver to your area yet."
              actionLabel="Browse all stores"
            />
          ) : (
            <div className="space-y-6">
              {stores.map((store) => (
                <div key={store.id} className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-card">
                  <StoreCardItem store={store} variant="compact" productCount={store.productCount} />
                  <StoreProductsPreview store={store} categoryId={apiCategory?.id} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function StoreProductsPreview({
  store,
  categoryId,
}: {
  store: StoreCardWithCount;
  categoryId?: string;
}) {
  const { data, isLoading } = useStoreProducts(store.slug, { categoryId, page: 1, limit: 8 });
  const products = data?.data ?? [];

  if (isLoading) return <ProductGridSkeleton count={4} />;
  if (products.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-jd-text-secondary">Popular in this store</p>
        <Link href={`/stores/${store.slug}`} className="text-xs font-semibold text-primary hover:underline">
          View all →
        </Link>
      </div>
      <HorizontalCarousel label={`Products at ${store.name}`} itemClassName="w-[152px] sm:w-[168px]">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              ...product,
              store: { id: store.id, name: store.name, slug: store.slug },
            }}
            variant="carousel"
            storeId={store.id}
            trackView
          />
        ))}
      </HorizontalCarousel>
    </div>
  );
}
