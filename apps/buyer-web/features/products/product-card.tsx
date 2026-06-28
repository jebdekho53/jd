'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, Heart, Scale, Star } from 'lucide-react';
import { ComparePricesModal } from '@/components/compare/compare-prices-modal';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import { useDeliveryLocation } from '@/hooks/use-delivery-location';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { useWishlist } from '@/hooks/use-wishlist';
import { formatCurrency, cn } from '@/lib/utils';
import type { BuyerProduct, BuyerProductWithStore } from '@/types/buyer';

type ProductItem = BuyerProduct | BuyerProductWithStore;

interface ProductCardProps {
  product: ProductItem;
  showStore?: boolean;
  variant?: 'grid' | 'carousel';
  storeId?: string;
  className?: string;
  trackView?: boolean;
  storeCount?: number;
  showWishlist?: boolean;
  rating?: number;
}

function getDefaultVariant(product: ProductItem) {
  return product.variants.find((v) => v.isDefault) ?? product.variants[0];
}

function getDisplayPrice(product: ProductItem) {
  const v = getDefaultVariant(product);
  return { price: v?.price ?? product.basePrice, mrp: v?.mrp ?? product.mrp };
}

function stockLabel(availableQty: number): string | null {
  if (availableQty <= 0) return 'Out of Stock';
  if (availableQty <= 10) return 'Low Stock';
  return null;
}

function getWeightLabel(product: ProductItem): string {
  const v = getDefaultVariant(product);
  if (v?.weightGrams) {
    return v.weightGrams >= 1000
      ? `${(v.weightGrams / 1000).toFixed(v.weightGrams % 1000 === 0 ? 0 : 1)} kg`
      : `${v.weightGrams} g`;
  }
  return product.unit;
}

export function ProductCard({
  product,
  showStore = false,
  variant = 'grid',
  storeId,
  className,
  trackView = false,
  storeCount,
  showWishlist = true,
  rating,
}: ProductCardProps) {
  const { addItem } = useRecentlyViewed();
  const { isWishlisted, toggle } = useWishlist();
  const { lat, lng, pincode } = useDeliveryLocation();
  const [compareOpen, setCompareOpen] = useState(false);
  const wishlisted = isWishlisted(product.id);
  const { price, mrp } = getDisplayPrice(product);
  const hasDiscount = mrp !== null && mrp > price;
  const savings = hasDiscount ? mrp! - price : 0;
  const discountPct = hasDiscount ? Math.round((savings / mrp!) * 100) : 0;
  const store = 'store' in product ? product.store : null;
  const defaultVariant = getDefaultVariant(product);
  const availableQty = defaultVariant?.availableQty ?? 0;
  const stock = stockLabel(availableQty);
  const resolvedStoreId = storeId ?? store?.id;
  const weight = getWeightLabel(product);

  const productHref = (() => {
    const params = new URLSearchParams();
    if (store?.slug) params.set('store', store.slug);
    params.set('q', product.name);
    const qs = params.toString();
    return `/products/${product.id}${qs ? `?${qs}` : ''}`;
  })();
  const handleView = () => {
    if (trackView) addItem(product, store ? { name: store.name, slug: store.slug } : undefined);
  };

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated',
        variant === 'carousel' && 'w-[152px] sm:w-[168px]',
        className,
      )}
      onMouseEnter={trackView ? handleView : undefined}
    >
      <Link href={productHref} className="relative block aspect-square bg-cream-3">
        {product.imageUrls[0] ? (
          <Image
            src={product.imageUrls[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={variant === 'carousel' ? '168px' : '(max-width: 640px) 50vw, 25vw'}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-bold text-primary/20">
            {product.name.charAt(0)}
          </div>
        )}

        {stock && (
          <span
            className={cn(
              'absolute bottom-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
              stock === 'Out of Stock' ? 'bg-destructive text-white' : 'bg-amber-500 text-white',
            )}
          >
            {stock}
          </span>
        )}

        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-jd-text-primary">
            {discountPct}% OFF
          </span>
        )}

        {product.isVeg !== null && (
          <span
            className={cn(
              'absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded border-2 bg-white',
              product.isVeg ? 'border-success' : 'border-destructive',
            )}
            title={product.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
            aria-label={product.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
          >
            <span
              className={cn('h-2 w-2 rounded-full', product.isVeg ? 'bg-success' : 'bg-destructive')}
            />
          </span>
        )}
      </Link>

      <div className="absolute right-2 top-8 z-10 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100">
        {showWishlist && (
          <button
            type="button"
            onClick={() => toggle(product)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card/90 shadow-card"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wishlisted}
          >
            <Heart
              className={cn('h-4 w-4', wishlisted ? 'fill-destructive text-destructive' : 'text-jd-text-muted')}
            />
          </button>
        )}
        <Link
          href={productHref}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-card/90 shadow-card"
          aria-label="View product"
        >
          <Eye className="h-4 w-4 text-jd-text-muted" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-3">
        {showStore && store && (
          <p className="mb-0.5 truncate text-[10px] font-medium text-jd-text-muted">{store.name}</p>
        )}
        {storeCount !== undefined && storeCount > 1 && (
          <p className="mb-0.5 text-[10px] font-medium text-primary">{storeCount} stores</p>
        )}
        <Link href={productHref}>
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-jd-text-primary sm:text-sm">
            {product.name}
          </h3>
        </Link>
        <p className="mt-0.5 text-[10px] text-jd-text-muted">{weight}</p>

        {rating !== undefined && (
          <p className="mt-1 flex items-center gap-0.5 text-[10px] text-jd-text-muted">
            <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />
            {rating.toFixed(1)}
          </p>
        )}

        <div className="mt-auto space-y-2 pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-jd-text-primary">{formatCurrency(price)}</span>
            {hasDiscount && (
              <span className="text-[10px] text-jd-text-muted line-through">{formatCurrency(mrp!)}</span>
            )}
          </div>
          {hasDiscount && savings > 0 && (
            <p className="text-[10px] font-medium text-success">Save {formatCurrency(savings)}</p>
          )}

          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-primary/30 py-1.5 text-[10px] font-semibold text-primary transition hover:bg-primary/5 btn-press"
            >
              <Scale className="h-3 w-3" aria-hidden />
              Compare
            </button>
            {defaultVariant && resolvedStoreId && (
              <div className="flex-1">
                <AddToCartButton
                  productId={product.id}
                  variantId={defaultVariant.id}
                  storeId={resolvedStoreId}
                  storeName={store?.name ?? 'Store'}
                  availableQty={defaultVariant.availableQty}
                  compact
                  className="h-8 w-full text-[10px]"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ComparePricesModal
        productId={product.id}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        lat={lat}
        lng={lng}
        pincode={pincode}
      />
    </article>
  );
}
