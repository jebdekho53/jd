'use client';

import Link from 'next/link';
import { Clock, Heart, Star, Store } from 'lucide-react';
import { Badge } from '@/design-system/primitives';
import { cn } from '@/lib/utils';
import type { BuyerProductWithStore, BuyerVariant } from '@/types/buyer';
import { formatEta, getVariantLabel, stockLabel, type StockStatus } from '../utils';

interface PdpSummaryProps {
  product: BuyerProductWithStore;
  variant: BuyerVariant;
  stockStatus: StockStatus;
  wishlisted: boolean;
  onToggleWishlist: () => void;
  etaMins?: number | null;
}

export function PdpSummary({
  product,
  variant,
  stockStatus,
  wishlisted,
  onToggleWishlist,
  etaMins,
}: PdpSummaryProps) {
  const productRating = product.reviewSummary?.ratingCount
    ? product.reviewSummary.ratingAvg
    : undefined;
  const productReviewCount = product.reviewSummary?.ratingCount ?? 0;
  const rating = productRating ?? product.store.ratingAvg;
  const reviewCount =
    productReviewCount > 0 ? productReviewCount : product.store.ratingCount;
  const eta = formatEta(etaMins ?? product.store.avgPrepTimeMins);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {product.brand && (
            <Link
              href={`/brand/${product.brand.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
            >
              {product.brand}
            </Link>
          )}
          <h1 className="text-lg font-bold leading-snug text-jd-text-primary sm:text-xl lg:text-2xl">
            {product.name}
          </h1>
          <p className="text-sm text-jd-text-muted">{getVariantLabel(variant, product.unit)}</p>
        </div>
        <button
          type="button"
          onClick={onToggleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={wishlisted}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-card lg:flex"
        >
          <Heart
            className={cn('h-5 w-5', wishlisted ? 'fill-destructive text-destructive' : 'text-jd-text-muted')}
          />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {rating != null && rating > 0 && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 font-semibold text-amber-800">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden />
            {rating.toFixed(1)}
            {reviewCount != null && reviewCount > 0 && (
              <span className="font-normal text-amber-700/80">
                ({reviewCount}
                {productReviewCount > 0 ? ' reviews' : ''})
              </span>
            )}
          </span>
        )}
        {eta && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-primary">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {eta} delivery
          </span>
        )}
        <Badge
          tone={stockStatus === 'out_of_stock' ? 'danger' : stockStatus === 'low_stock' ? 'warning' : 'success'}
        >
          {stockLabel(stockStatus)}
        </Badge>
      </div>

      <Link
        href={`/stores/${product.store.slug}`}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-card transition hover:border-primary/30"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Store className="h-4 w-4" aria-hidden />
        </span>
        <span>
          <span className="block text-[10px] uppercase tracking-wide text-jd-text-muted">Sold by</span>
          <span className="font-semibold text-jd-text-primary">{product.store.name}</span>
        </span>
      </Link>

      {product.isVeg !== null && (
        <p className="text-xs text-jd-text-muted">
          {product.isVeg ? '🟢 Vegetarian' : '🔴 Non-vegetarian'}
        </p>
      )}
    </div>
  );
}

interface PdpVariantSelectorProps {
  variants: BuyerVariant[];
  selectedId: string;
  unit: string;
  onSelect: (id: string) => void;
}

export function PdpVariantSelector({ variants, selectedId, unit, onSelect }: PdpVariantSelectorProps) {
  if (variants.length <= 1) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-jd-text-primary">Select size</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const out = v.availableQty <= 0;
          const selected = v.id === selectedId;
          return (
            <button
              key={v.id}
              type="button"
              disabled={out}
              onClick={() => onSelect(v.id)}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm font-medium transition',
                selected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-jd-text-secondary hover:border-primary/40',
                out && 'cursor-not-allowed opacity-40',
              )}
            >
              {getVariantLabel(v, unit)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
