'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Scale, ShoppingCart, Store } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { SectionHeader } from '@/components/v2/section-header';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import { ProductCard } from '@/features/products/product-card';
import { useProductSearch, useStoreProducts, useStore } from '@/hooks/use-buyer-queries';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { buildCompareGroups } from '@/lib/compare-products';
import { productJsonLd } from '@/lib/seo/metadata';
import { formatCurrency, cn } from '@/lib/utils';
import type { BuyerProductWithStore } from '@/types/buyer';

function getDefaultVariant(product: BuyerProductWithStore) {
  return product.variants.find((v) => v.isDefault) ?? product.variants[0];
}

export function ProductDetailContent({ productId }: { productId: string }) {
  const searchParams = useSearchParams();
  const storeSlug = searchParams.get('store') ?? undefined;
  const nameHint = searchParams.get('q') ?? undefined;
  const { items: recent } = useRecentlyViewed();
  const recentItem = recent.find((i) => i.id === productId);

  const searchQ = nameHint ?? recentItem?.name ?? productId;
  const { data: searchData, isLoading: searchLoading, isError, error, refetch } = useProductSearch(
    { q: searchQ, page: 1, limit: 40 },
    searchQ.length >= 2,
  );

  const { data: storeProducts, isLoading: storeLoading } = useStoreProducts(storeSlug ?? '', {
    page: 1,
    limit: 100,
  });
  const { data: storeDetail } = useStore(storeSlug ?? '');

  const offers: BuyerProductWithStore[] = useMemo(() => {
    const fromSearch = (searchData?.data ?? []).filter((p) => p.id === productId);
    if (fromSearch.length > 0) return fromSearch;
    const allSearch = searchData?.data ?? [];
    const byName = allSearch.filter(
      (p) => p.name.toLowerCase() === searchQ.toLowerCase(),
    );
    if (byName.length > 0) return byName;
    if (storeSlug && storeProducts?.data && storeDetail) {
      const found = storeProducts.data.find((p) => p.id === productId);
      if (found) {
        return [
          {
            ...found,
            store: { id: storeDetail.id, name: storeDetail.name, slug: storeDetail.slug },
          },
        ];
      }
    }
    return allSearch.slice(0, 1);
  }, [searchData, storeProducts, storeDetail, productId, searchQ, storeSlug]);

  const product = offers[0];
  const isLoading = searchLoading || (Boolean(storeSlug) && storeLoading);
  const compareGroup = useMemo(
    () => (offers.length > 0 ? buildCompareGroups(offers, 1)[0] : undefined),
    [offers],
  );

  const similar = useMemo(() => {
    if (!product?.category) return searchData?.data?.filter((p) => p.id !== productId).slice(0, 8) ?? [];
    return (searchData?.data ?? [])
      .filter((p) => p.category?.id === product.category?.id && p.id !== productId)
      .slice(0, 8);
  }, [searchData, product, productId]);

  if (isLoading) {
    return (
      <PageShell>
        <ProductGridSkeleton count={1} />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell>
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load product'}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell>
        <EmptyState
          variant="search"
          title="Product not found"
          description="This product may no longer be available. Try searching for something else."
          actionLabel="Search products"
        />
      </PageShell>
    );
  }

  const variant = getDefaultVariant(product);
  const price = variant?.price ?? product.basePrice;
  const mrp = variant?.mrp ?? product.mrp;
  const hasDiscount = mrp !== null && mrp > price;
  const discountPct = hasDiscount ? Math.round(((mrp! - price) / mrp!) * 100) : 0;
  const storeCount = offers.length;

  const jsonLd = productJsonLd({
    name: product.name,
    description: product.description,
    imageUrls: product.imageUrls,
    price,
  });

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="space-y-8">
        <nav className="text-xs text-jd-text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary">Home</Link>
          {' / '}
          <Link href="/products" className="hover:text-primary">Products</Link>
          {product.category && (
            <>
              {' / '}
              <Link href={`/categories/${product.category.slug}`} className="hover:text-primary">
                {product.category.name}
              </Link>
            </>
          )}
          {' / '}
          <span className="text-jd-text-primary">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream-3">
              {product.imageUrls[0] ? (
                <Image
                  src={product.imageUrls[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl font-bold text-primary/20">
                  {product.name.charAt(0)}
                </div>
              )}
            </div>
            {product.imageUrls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.imageUrls.map((url, i) => (
                  <div key={url} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {product.brand && (
              <p className="text-sm font-medium text-jd-text-muted">{product.brand}</p>
            )}
            <h1 className="text-2xl font-bold text-jd-text-primary">{product.name}</h1>
            <p className="text-sm text-jd-text-muted">{product.unit}</p>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-jd-text-primary">{formatCurrency(price)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-jd-text-muted line-through">{formatCurrency(mrp!)}</span>
                  <span className="rounded-md bg-accent/20 px-2 py-0.5 text-sm font-bold text-jd-text-primary">
                    {discountPct}% OFF
                  </span>
                </>
              )}
            </div>

            {storeCount > 1 && (
              <p className="text-sm font-medium text-primary">
                Available at {storeCount} stores — compare to save
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {variant && product.store && (
                <AddToCartButton
                  productId={product.id}
                  variantId={variant.id}
                  storeId={product.store.id}
                  storeName={product.store.name}
                  availableQty={variant.availableQty}
                  className="min-w-[140px]"
                />
              )}
              <Link
                href={`/compare?q=${encodeURIComponent(product.name)}`}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                <Scale className="h-4 w-4" aria-hidden />
                Compare prices
              </Link>
            </div>

            {product.description && (
              <div>
                <h2 className="text-sm font-semibold text-jd-text-primary">Description</h2>
                <p className="mt-1 text-sm text-jd-text-muted">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {compareGroup && compareGroup.offers.length > 1 && (
          <section aria-labelledby="compare-table-heading">
            <h2 id="compare-table-heading" className="mb-4 text-xl font-semibold text-jd-text-primary">
              Price comparison
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-border/50">
              <table className="w-full min-w-[400px] text-sm">
                <thead className="bg-cream-3">
                  <tr className="text-left text-xs text-jd-text-muted">
                    <th className="p-3">Store</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">MRP</th>
                    <th className="p-3">You save</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {compareGroup.offers.map((offer, i) => {
                    const isBest = i === compareGroup.bestIndex;
                    const save = offer.mrp && offer.mrp > offer.price ? offer.mrp - offer.price : 0;
                    return (
                      <tr key={offer.storeId} className={cn('border-t', isBest && 'bg-primary/5')}>
                        <td className="p-3 font-medium">
                          <Link href={`/stores/${offer.storeSlug}`} className="hover:text-primary">
                            {offer.storeName}
                          </Link>
                          {isBest && (
                            <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold">
                              Best
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold">{formatCurrency(offer.price)}</td>
                        <td className="p-3 text-jd-text-muted">
                          {offer.mrp ? formatCurrency(offer.mrp) : '—'}
                        </td>
                        <td className="p-3 text-success">{save > 0 ? formatCurrency(save) : '—'}</td>
                        <td className="p-3">
                          <AddToCartButton
                            productId={offer.productId}
                            variantId={offer.variantId}
                            storeId={offer.storeId}
                            storeName={offer.storeName}
                            availableQty={99}
                            compact
                            className="h-8 text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {offers.length > 0 && (
          <section aria-labelledby="stores-heading">
            <h2 id="stores-heading" className="mb-4 text-xl font-semibold text-jd-text-primary">
              Available stores
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {offers.map((o) => (
                <Link
                  key={o.store.id}
                  href={`/stores/${o.store.slug}`}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 shadow-card card-hover"
                >
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-primary" aria-hidden />
                    <span className="font-medium">{o.store.name}</span>
                  </div>
                  <span className="font-bold text-primary">
                    {formatCurrency(getDefaultVariant(o)?.price ?? o.basePrice)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section aria-labelledby="similar-heading">
            <SectionHeader title="Similar products" href="/products" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {similar.map((p) => (
                <ProductCard key={`${p.id}-${p.store.id}`} product={p} showStore trackView />
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section aria-labelledby="fbt-heading">
            <SectionHeader title="Frequently bought together" />
            <HorizontalCarousel label="Frequently bought together" itemClassName="w-[168px]">
              {similar.slice(0, 4).map((p) => (
                <ProductCard key={`fbt-${p.id}`} product={p} variant="carousel" showStore />
              ))}
            </HorizontalCarousel>
          </section>
        )}
      </div>
    </PageShell>
  );
}
