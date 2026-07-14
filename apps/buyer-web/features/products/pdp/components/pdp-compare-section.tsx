'use client';

import Link from 'next/link';
import { MapPin, Scale, Star, Truck } from 'lucide-react';
import { Spinner } from '@/design-system/primitives';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import { formatCurrency, cn } from '@/lib/utils';
import type { CompareProductData } from '../hooks/use-compare-product';
import { formatEta } from '../utils';

interface PdpCompareSectionProps {
  data?: CompareProductData | null;
  isLoading: boolean;
}

export function PdpCompareSection({ data, isLoading }: PdpCompareSectionProps) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6" aria-labelledby="pdp-compare-heading">
        <h2 id="pdp-compare-heading" className="mb-4 flex items-center gap-2 text-lg font-semibold text-jd-text-primary">
          <Scale className="h-5 w-5 text-primary" aria-hidden />
          Compare prices near you
        </h2>
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </section>
    );
  }

  if (!data || data.stores.length < 2) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5" aria-labelledby="pdp-compare-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="pdp-compare-heading" className="flex items-center gap-2 text-lg font-semibold text-jd-text-primary">
          <Scale className="h-5 w-5 text-primary" aria-hidden />
          Compare prices near you
        </h2>
        {data.savings > 0 && (
          <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
            Save up to {formatCurrency(data.savings)}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {data.stores.map((row) => {
          const isBest = row.cheapest;
          const eta = formatEta(row.etaMins);

          return (
            <div
              key={row.storeId}
              className={cn(
                'rounded-xl border p-3 sm:p-4',
                isBest ? 'border-success/40 bg-success/5' : 'border-border bg-background',
                !row.serviceable && 'opacity-70',
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/store/${row.storeSlug}`}
                      className="font-semibold text-jd-text-primary hover:text-primary"
                    >
                      {row.storeName}
                    </Link>
                    {isBest && (
                      <span className="rounded bg-success px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                        Cheapest
                      </span>
                    )}
                    {!row.serviceable && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                        Not serviceable
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-jd-text-muted">
                    <span className="font-bold text-base text-jd-text-primary tabular-nums sm:text-sm">
                      {formatCurrency(row.offerPrice)}
                      {row.mrp != null && row.mrp > row.offerPrice && (
                        <span className="ml-1 font-normal line-through">{formatCurrency(row.mrp)}</span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Truck className="h-3 w-3" aria-hidden />
                      +{formatCurrency(row.deliveryFee)} delivery
                    </span>
                    {row.distanceKm != null && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {row.distanceKm.toFixed(1)} km
                      </span>
                    )}
                    {eta && <span>{eta}</span>}
                    {row.rating != null && (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                        {row.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-jd-text-secondary">
                    Pay {formatCurrency(row.finalPayableAmount)} incl. delivery
                    {row.minimumOrder > 0 ? ` · Min order ${formatCurrency(row.minimumOrder)}` : ''}
                    {row.deliveryPartner ? ` · ${row.deliveryPartner}` : ''}
                  </p>
                </div>
                <AddToCartButton
                  productId={row.productId}
                  variantId={row.variantId}
                  storeId={row.storeId}
                  storeName={row.storeName}
                  availableQty={row.stock}
                  compact={false}
                  className="w-full shrink-0 sm:w-auto sm:min-w-[140px]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
