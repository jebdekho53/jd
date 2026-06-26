'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Check, Heart, Scale, Share2, Store, TrendingDown } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { SectionHeader } from '@/components/v2/section-header';
import { ActionBar } from '@/design-system/primitives';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import { ProductCard } from '@/features/products/product-card';
import { useProductById, useProductSearch } from '@/hooks/use-buyer-queries';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { useWishlist } from '@/hooks/use-wishlist';
import { buildCompareGroups } from '@/lib/compare-products';
import { productJsonLd } from '@/lib/seo/metadata';
import { ApiError } from '@/services/api/client';
import { formatCurrency, cn } from '@/lib/utils';
import type { BuyerProductWithStore } from '@/types/buyer';

function getDefaultVariant(product: BuyerProductWithStore) {
  return product.variants.find((v) => v.isDefault) ?? product.variants[0];
}

function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;

  const goTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive((prev) => (prev === i ? prev : i));
  };

  if (!hasImages) {
    return (
      <div className="relative grid aspect-square place-items-center rounded-2xl bg-cream-3 text-6xl font-bold text-primary/20">
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none rounded-2xl"
        >
          {images.map((url, i) => (
            <div key={url} className="relative aspect-square w-full shrink-0 snap-center bg-cream-3">
              <Image
                src={url}
                alt={`${name} image ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">
            {images.map((url, i) => (
              <span
                key={url}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  active === i ? 'w-5 bg-white' : 'w-1.5 bg-white/60',
                )}
              />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="hidden gap-2 overflow-x-auto scrollbar-none md:flex">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition',
                active === i ? 'border-primary' : 'border-transparent',
              )}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetailContent({ productId }: { productId: string }) {
  const searchParams = useSearchParams();
  const storeSlug = searchParams.get('store') ?? undefined;
  const nameHint = searchParams.get('q') ?? undefined;
  const { items: recent } = useRecentlyViewed();
  const recentItem = recent.find((i) => i.id === productId);
  const { isWishlisted, toggle } = useWishlist();
  const [copied, setCopied] = useState(false);

  const searchQ = nameHint ?? recentItem?.name ?? '';
  const {
    data: primaryProduct,
    isLoading: productLoading,
    isError,
    error,
    refetch,
  } = useProductById(productId, storeSlug);

  const { data: searchData } = useProductSearch(
    { q: primaryProduct?.name ?? searchQ, page: 1, limit: 40 },
    Boolean(primaryProduct?.name ?? (searchQ.length >= 2)),
  );

  const offers: BuyerProductWithStore[] = useMemo(() => {
    if (!primaryProduct) return [];
    const fromSearch = (searchData?.data ?? []).filter(
      (p) =>
        p.id === productId ||
        p.name.toLowerCase() === primaryProduct.name.toLowerCase(),
    );
    if (fromSearch.length > 0) return fromSearch;
    return [primaryProduct];
  }, [primaryProduct, searchData, productId]);

  const product = offers[0];
  const isLoading = productLoading;
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

  if (isError && !(error instanceof ApiError && error.status === 404)) {
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
  const wishlisted = isWishlisted(product.id);

  const bestOffer =
    compareGroup && compareGroup.offers.length > 1
      ? compareGroup.offers[compareGroup.bestIndex]
      : undefined;
  const lowestPrice = bestOffer?.price ?? price;

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: product.name, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled share */
    }
  };

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
      <div className="space-y-8 pb-24 md:pb-0">
        <nav className="hidden text-xs text-jd-text-muted md:block" aria-label="Breadcrumb">
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

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <div className="relative">
            <ProductGallery images={product.imageUrls} name={product.name} />
            <div className="absolute right-3 top-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => toggle(product)}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                aria-pressed={wishlisted}
                className="grid h-10 w-10 place-items-center rounded-full bg-card/95 shadow-pop backdrop-blur transition hover:scale-105"
              >
                <Heart
                  className={cn('h-5 w-5', wishlisted ? 'fill-destructive text-destructive' : 'text-jd-text-muted')}
                />
              </button>
              <button
                type="button"
                onClick={handleShare}
                aria-label={copied ? 'Link copied' : 'Share product'}
                className="grid h-10 w-10 place-items-center rounded-full bg-card/95 shadow-pop backdrop-blur transition hover:scale-105"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <Share2 className="h-5 w-5 text-jd-text-muted" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {product.brand && (
              <p className="text-sm font-medium text-jd-text-muted">{product.brand}</p>
            )}
            <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">{product.name}</h1>
            <p className="text-sm text-jd-text-muted">{product.unit}</p>

            <div className="flex flex-wrap items-baseline gap-3">
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

            {bestOffer && lowestPrice < price && (
              <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-sm">
                <TrendingDown className="h-4 w-4 shrink-0 text-success" aria-hidden />
                <span className="text-jd-text-secondary">
                  Lowest nearby price{' '}
                  <span className="font-bold text-success">{formatCurrency(lowestPrice)}</span> at{' '}
                  <Link href={`/stores/${bestOffer.storeSlug}`} className="font-semibold text-primary hover:underline">
                    {bestOffer.storeName}
                  </Link>
                </span>
              </div>
            )}

            {storeCount > 1 && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Scale className="h-4 w-4" aria-hidden />
                Available at {storeCount} stores — compare to save
              </p>
            )}

            {/* Desktop inline actions; mobile uses sticky ActionBar */}
            <div className="hidden flex-wrap gap-3 md:flex">
              {variant && product.store && (
                <AddToCartButton
                  productId={product.id}
                  variantId={variant.id}
                  storeId={product.store.id}
                  storeName={product.store.name}
                  availableQty={variant.availableQty}
                  className="min-w-[160px]"
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
              <div className="border-t border-border pt-4">
                <h2 className="text-sm font-semibold text-jd-text-primary">Description</h2>
                <p className="mt-1 text-sm text-jd-text-muted">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {compareGroup && compareGroup.offers.length > 1 && (
          <section aria-labelledby="compare-heading">
            <h2 id="compare-heading" className="mb-4 text-lg font-semibold text-jd-text-primary md:text-xl">
              Price comparison
            </h2>

            {/* Mobile: cards */}
            <div className="space-y-2 md:hidden">
              {compareGroup.offers.map((offer, i) => {
                const isBest = i === compareGroup.bestIndex;
                const save = offer.mrp && offer.mrp > offer.price ? offer.mrp - offer.price : 0;
                return (
                  <div
                    key={offer.storeId}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-2xl border bg-card p-3',
                      isBest ? 'border-success/40 bg-success/5' : 'border-border',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/stores/${offer.storeSlug}`}
                        className="line-clamp-1 text-sm font-semibold text-jd-text-primary hover:text-primary"
                      >
                        {offer.storeName}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-base font-bold text-jd-text-primary">
                          {formatCurrency(offer.price)}
                        </span>
                        {save > 0 && (
                          <span className="text-xs font-medium text-success">
                            Save {formatCurrency(save)}
                          </span>
                        )}
                        {isBest && (
                          <span className="rounded bg-success px-1.5 py-0.5 text-[9px] font-bold text-white">
                            Best price
                          </span>
                        )}
                      </div>
                    </div>
                    <AddToCartButton
                      productId={offer.productId}
                      variantId={offer.variantId}
                      storeId={offer.storeId}
                      storeName={offer.storeName}
                      availableQty={99}
                      compact
                      className="h-9 shrink-0 text-xs"
                    />
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
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
                      <tr key={offer.storeId} className={cn('border-t border-border', isBest && 'bg-success/5')}>
                        <td className="p-3 font-medium">
                          <Link href={`/stores/${offer.storeSlug}`} className="hover:text-primary">
                            {offer.storeName}
                          </Link>
                          {isBest && (
                            <span className="ml-2 rounded bg-success px-1.5 py-0.5 text-[9px] font-bold text-white">
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
            <h2 id="stores-heading" className="mb-4 text-lg font-semibold text-jd-text-primary md:text-xl">
              Available stores
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {offers.map((o) => (
                <Link
                  key={o.store.id}
                  href={`/stores/${o.store.slug}`}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card card-hover"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Store className="h-4 w-4" aria-hidden />
                    </div>
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
            <HorizontalCarousel label="Frequently bought together" itemClassName="w-[152px] sm:w-[168px]">
              {similar.slice(0, 6).map((p) => (
                <ProductCard key={`fbt-${p.id}`} product={p} variant="carousel" showStore />
              ))}
            </HorizontalCarousel>
          </section>
        )}
      </div>

      {/* Mobile sticky add-to-cart */}
      {variant && product.store && (
        <ActionBar position="aboveNav">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-jd-text-primary">{formatCurrency(price)}</span>
              {hasDiscount && (
                <span className="text-xs text-jd-text-muted line-through">{formatCurrency(mrp!)}</span>
              )}
            </div>
            <p className="line-clamp-1 text-[11px] text-jd-text-muted">{product.unit}</p>
          </div>
          <div className="w-[150px] shrink-0">
            <AddToCartButton
              productId={product.id}
              variantId={variant.id}
              storeId={product.store.id}
              storeName={product.store.name}
              availableQty={variant.availableQty}
              className="w-full"
            />
          </div>
        </ActionBar>
      )}
    </PageShell>
  );
}
