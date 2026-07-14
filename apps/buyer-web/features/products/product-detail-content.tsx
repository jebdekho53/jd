'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getSiteUrl } from '@jebdekho/web-config';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ComparePricesModal } from '@/components/compare/compare-prices-modal';
import { ActionBar } from '@/design-system/primitives';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import { useProductById, useProductSearch, useStore } from '@/hooks/use-buyer-queries';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { trackReach } from '@/lib/analytics/track';
import { useProductStockRealtime } from '@/features/products/use-product-stock-realtime';
import { useWishlist } from '@/hooks/use-wishlist';
import { buildCompareGroups } from '@/lib/compare-products';
import { ApiError } from '@/services/api/client';
import { formatCurrency, cn } from '@/lib/utils';
import type { BuyerProductWithStore, BuyerVariant } from '@/types/buyer';
import { PdpMobileHeader } from './pdp/components/pdp-mobile-header';
import { PdpGallery } from './pdp/components/pdp-gallery';
import { PdpSummary } from './pdp/components/pdp-summary';
import { PdpPriceBlock } from './pdp/components/pdp-price-block';
import { PdpPurchaseCard } from './pdp/components/pdp-purchase-card';
import { PdpCompareSection } from './pdp/components/pdp-compare-section';
import { PdpOffersSection } from './pdp/components/pdp-offers-section';
import { PdpDeliverySection } from './pdp/components/pdp-delivery-section';
import { PdpDetailsSection } from './pdp/components/pdp-details-section';
import { PdpReturnPolicySection } from './pdp/components/pdp-return-policy-section';
import { PdpTrustSection } from './pdp/components/pdp-trust-section';
import { PdpReviewsSection } from './pdp/components/pdp-reviews-section';
import { PdpSimilarSection } from './pdp/components/pdp-similar-section';
import { PdpSkeleton } from './pdp/components/pdp-skeleton';
import { useCompareProduct } from './pdp/hooks/use-compare-product';
import { useEffectiveLocation } from '@/store/location-store';
import {
  calcDiscount,
  getDefaultVariant,
  getStockStatus,
} from './pdp/utils';

export function ProductDetailContent({ productId }: { productId: string }) {
  const searchParams = useSearchParams();
  const storeSlug = searchParams.get('store') ?? undefined;
  const nameHint = searchParams.get('q') ?? undefined;
  const { items: recent, addItem: trackView } = useRecentlyViewed();
  const recentItem = recent.find((i) => i.id === productId);
  // Keeps the stock badge and Add-to-cart honest if the item sells out while read.
  useProductStockRealtime(productId);
  const { isWishlisted, toggle } = useWishlist();
  const [copied, setCopied] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const { lat, lng, pincode } = useEffectiveLocation();

  const searchQ = nameHint ?? recentItem?.name ?? '';
  const {
    data: primaryProduct,
    isLoading: productLoading,
    isError,
    error,
    refetch,
  } = useProductById(productId, storeSlug);

  const { data: searchData } = useProductSearch(
    {
      q: primaryProduct?.name ?? searchQ,
      page: 1,
      limit: 40,
      categoryId: primaryProduct?.category?.id,
    },
    Boolean(primaryProduct?.name ?? (searchQ.length >= 2)),
  );

  const { data: compareData, isLoading: compareLoading } = useCompareProduct(
    productId,
    Boolean(primaryProduct),
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
  const { data: storeDetail } = useStore(product?.store.slug ?? '');

  useEffect(() => {
    if (product) {
      trackView(product, { name: product.store.name, slug: product.store.slug });
      trackReach('VIEW_PRODUCT', { productId: product.id, storeId: product.store.id }, product.id);
    }
  }, [product, trackView]);

  useEffect(() => {
    if (product && !selectedVariantId) {
      setSelectedVariantId(getDefaultVariant(product)?.id ?? null);
    }
  }, [product, selectedVariantId]);

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

  const sameBrand = useMemo(() => {
    if (!product?.brand) return [];
    return (searchData?.data ?? [])
      .filter(
        (p) =>
          p.id !== productId &&
          p.brand?.toLowerCase() === product.brand?.toLowerCase(),
      )
      .slice(0, 4);
  }, [searchData, product, productId]);

  if (productLoading) {
    return (
      <PageShell hideMobileNav hideFloatingCart className="!pt-0 md:!pt-6">
        <PdpSkeleton />
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

  const variant: BuyerVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? getDefaultVariant(product)!;
  const price = variant.price;
  const mrp = variant.mrp ?? product.mrp;
  const { discountPct } = calcDiscount(price, mrp);
  const stockStatus = getStockStatus(variant.availableQty);
  const wishlisted = isWishlisted(product.id);
  const storeCount = offers.length;

  const bestOffer =
    compareGroup && compareGroup.offers.length > 1
      ? compareGroup.offers[compareGroup.bestIndex]
      : undefined;
  const lowestNearby = bestOffer
    ? { price: bestOffer.price, storeName: bestOffer.storeName, storeSlug: bestOffer.storeSlug }
    : compareData && compareData.stores.length > 0
      ? {
          price: compareData.stores[0]!.finalPayableAmount,
          storeName: compareData.stores[0]!.storeName,
          storeSlug: compareData.stores[0]!.storeSlug,
        }
      : undefined;

  const siteUrl = getSiteUrl();
  const canonicalPath = `/products/${productId}${storeSlug ? `?store=${storeSlug}` : ''}`;

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : `${siteUrl}${canonicalPath}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: product.name, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  };

  // Product / Breadcrumb / FAQ JSON-LD is now server-rendered in
  // app/products/[id]/page.tsx so crawlers and answer engines see it without
  // executing JS. It is intentionally NOT emitted here to avoid duplication.

  return (
    <PageShell hideMobileNav hideFloatingCart className="!px-0 !pt-0 md:!px-4 md:!pt-6">
      <div className="px-4 md:px-0">
        <PdpMobileHeader title={product.name} onShare={handleShare} shared={copied} />

        <nav className="mb-4 hidden text-xs text-jd-text-muted md:block" aria-label="Breadcrumb">
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

        <div className="lg:grid lg:grid-cols-[minmax(0,42%)_minmax(0,1fr)_300px] lg:items-start lg:gap-8">
          {/* Gallery */}
          <div className="relative -mx-4 md:mx-0">
            <PdpGallery
              images={product.imageUrls}
              name={product.name}
              discountPct={discountPct}
              stockStatus={stockStatus}
            />
          </div>

          {/* Main column */}
          <div className="mt-4 space-y-5 lg:mt-0">
            <PdpSummary
              product={product}
              variant={variant}
              stockStatus={stockStatus}
              wishlisted={wishlisted}
              onToggleWishlist={() => toggle(product)}
              etaMins={product.store.avgPrepTimeMins}
            />

            <PdpPriceBlock price={price} mrp={mrp} lowestNearby={lowestNearby} />

            {/* Mobile purchase (non-sticky inline) */}
            <div className="lg:hidden">
              <PdpPurchaseCard
                product={product}
                variant={variant}
                variants={product.variants}
                selectedVariantId={variant.id}
                onVariantSelect={setSelectedVariantId}
                onCompare={() => setCompareOpen(true)}
                showCompare={storeCount > 1 || (compareData?.stores.length ?? 0) > 1}
              />
            </div>

            <PdpDeliverySection
              storeName={product.store.name}
              etaMins={product.store.avgPrepTimeMins}
              deliveryFee={product.store.deliveryFee ?? storeDetail?.deliveryFee}
              deliveryPartner={product.store.deliveryPartner}
            />

            <PdpCompareSection data={compareData} isLoading={compareLoading} />

            <PdpOffersSection productId={product.id} />

            <PdpDetailsSection product={product} />
            <PdpReturnPolicySection policy={product.returnPolicy} />
            <PdpTrustSection />
            <PdpReviewsSection
              productId={product.id}
              productName={product.name}
              reviewSummary={product.reviewSummary}
              storeRatingAvg={product.store.ratingAvg ?? storeDetail?.ratingAvg}
              storeRatingCount={product.store.ratingCount ?? storeDetail?.ratingCount}
              storeName={product.store.name}
            />

            <PdpSimilarSection
              similar={similar}
              sameBrand={sameBrand}
              brand={product.brand}
            />
          </div>

          {/* Desktop sticky purchase card */}
          <div className="hidden lg:block">
            <PdpPurchaseCard
              product={product}
              variant={variant}
              variants={product.variants}
              selectedVariantId={variant.id}
              onVariantSelect={setSelectedVariantId}
              onCompare={() => setCompareOpen(true)}
              showCompare={storeCount > 1 || (compareData?.stores.length ?? 0) > 1}
              sticky
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky add-to-cart */}
      {variant && product.store && stockStatus !== 'out_of_stock' && (
        <ActionBar position="aboveNav">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tabular-nums text-jd-text-primary">{formatCurrency(price)}</span>
              {mrp != null && mrp > price && (
                <span className="text-xs text-jd-text-muted line-through">{formatCurrency(mrp)}</span>
              )}
            </div>
            <p className={cn('line-clamp-1 text-[11px]', stockStatus === 'low_stock' ? 'font-medium text-amber-600' : 'text-jd-text-muted')}>
              {stockStatus === 'low_stock' ? `Only ${variant.availableQty} left` : product.unit}
            </p>
          </div>
          <div className="w-[min(50%,180px)] shrink-0">
            <AddToCartButton
              productId={product.id}
              variantId={variant.id}
              storeId={product.store.id}
              storeName={product.store.name}
              availableQty={variant.availableQty}
              productName={product.name}
              unitPrice={price}
              imageUrl={product.imageUrls[0]}
              className="w-full"
            />
          </div>
        </ActionBar>
      )}

      <ComparePricesModal
        productId={productId}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        lat={lat}
        lng={lng}
        pincode={pincode}
      />
    </PageShell>
  );
}
