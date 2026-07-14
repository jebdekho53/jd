'use client';

import Link from 'next/link';
import { TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { calcDiscount } from '../utils';

interface PdpPriceBlockProps {
  price: number;
  mrp: number | null;
  lowestNearby?: { price: number; storeName: string; storeSlug: string };
}

export function PdpPriceBlock({ price, mrp, lowestNearby }: PdpPriceBlockProps) {
  const { hasDiscount, savings, discountPct } = calcDiscount(price, mrp);

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="text-3xl font-bold tabular-nums text-jd-text-primary">{formatCurrency(price)}</span>
        {hasDiscount && (
          <>
            <span className="text-lg text-jd-text-muted line-through tabular-nums">{formatCurrency(mrp!)}</span>
            <span className="rounded-md bg-accent/25 px-2 py-0.5 text-sm font-bold text-jd-text-primary">
              {discountPct}% OFF
            </span>
          </>
        )}
      </div>
      {hasDiscount && savings > 0 && (
        <p className="text-sm font-semibold text-success">You save {formatCurrency(savings)}</p>
      )}
      <p className="text-[11px] text-jd-text-muted">Inclusive of all taxes</p>

      {lowestNearby && lowestNearby.price < price && (
        <div className="flex items-start gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-sm">
          <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          <span className="text-jd-text-secondary">
            Lowest nearby{' '}
            <span className="font-bold text-success">{formatCurrency(lowestNearby.price)}</span> at{' '}
            <Link href={`/store/${lowestNearby.storeSlug}`} className="font-semibold text-primary hover:underline">
              {lowestNearby.storeName}
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}
