'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton, StoreGridSkeleton } from '@/components/common/skeletons';
import { CategoryExplorer } from '@/components/discovery/category-explorer';
import { ProductCard } from '@/features/products/product-card';
import { StoreCardItem } from '@/features/stores/store-card';
import { useCategories, useCategoryStores, useStoreProducts } from '@/hooks/use-buyer-queries';
import { resolveCategorySlug, flattenCategories } from '@/lib/categories';
import type { StoreCardWithCount } from '@/types/buyer';
import { useLocationStore } from '@/store/ui-store';

export function CategoryDetailContent({ slug }: { slug: string }) {
  const { lat, lng } = useLocationStore();
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const category = useMemo(
    () => resolveCategorySlug(categories, slug),
    [categories, slug],
  );

  const flat = flattenCategories(categories);
  const apiCategory = flat.find((c) => c.slug === category.slug || c.id === category.id);

  const storeParams = useMemo(
    () => ({ lat, lng, radiusKm: 20, page: 1, limit: 12 }),
    [lat, lng],
  );

  const {
    data: storesData,
    isLoading: storesLoading,
    isError,
    error,
    refetch,
  } = useCategoryStores(apiCategory?.id ?? '', storeParams, Boolean(apiCategory?.id && lat && lng));

  const stores = storesData?.data ?? [];

  const subcategories = useMemo(() => {
    const found = flattenCategories(categories).find((c) => c.slug === category.slug);
    return found?.children ?? [];
  }, [categories, category.slug]);

  return (
    <PageShell>
      <div className="space-y-8">
        <nav className="text-xs text-jd-text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary">Home</Link>
          {' / '}
          <Link href="/categories" className="hover:text-primary">Categories</Link>
          {' / '}
          <span className="text-jd-text-primary">{category.name}</span>
        </nav>

        <header className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-jd-text-primary md:text-3xl">{category.name}</h1>
          <p className="mt-2 text-sm text-jd-text-muted">
            Stores near you selling {category.name.toLowerCase()}
          </p>
        </header>

        {subcategories.length > 0 && (
          <section aria-labelledby="subcat-heading">
            <h2 id="subcat-heading" className="mb-3 text-lg font-semibold text-jd-text-primary">
              Subcategories
            </h2>
            <CategoryExplorer categories={subcategories} />
          </section>
        )}

        <section aria-labelledby="stores-heading">
          <h2 id="stores-heading" className="mb-4 text-lg font-semibold text-jd-text-primary">
            Stores selling {category.name}
          </h2>
          {(storesLoading || catLoading) && <StoreGridSkeleton count={3} />}
          {isError && (
            <ErrorState
              message={error instanceof Error ? error.message : 'Failed to load stores'}
              onRetry={() => refetch()}
            />
          )}
          {!storesLoading && !isError && stores.length === 0 && (
            <EmptyState
              variant="search"
              title="No stores found"
              description="No approved stores in this category deliver to your area yet."
              actionLabel="Browse all stores"
            />
          )}
          <div className="space-y-8">
            {stores.map((store) => (
              <div key={store.id} className="space-y-4 rounded-2xl border bg-card p-4">
                <StoreCardItem store={store} variant="featured" />
                <StoreProductsPreview store={store} categoryId={apiCategory?.id} />
              </div>
            ))}
          </div>
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
  const { data, isLoading } = useStoreProducts(store.slug, { categoryId, page: 1, limit: 4 });
  const products = data?.data ?? [];

  if (isLoading) return <ProductGridSkeleton count={4} />;
  if (products.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-jd-text-secondary">Products in this store</p>
        <Link href={`/stores/${store.slug}`} className="text-xs font-semibold text-primary hover:underline">
          View store →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              ...product,
              store: { id: store.id, name: store.name, slug: store.slug },
            }}
          />
        ))}
      </div>
    </div>
  );
}
