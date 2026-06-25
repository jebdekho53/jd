'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { SectionHeader } from '@/components/v2/section-header';
import { ProductCard } from '@/features/products/product-card';
import { formatCurrency } from '@/lib/utils';
import type { BuyerProductWithStore } from '@/types/buyer';

function hasDiscount(p: BuyerProductWithStore) {
  const v = p.variants.find((x) => x.isDefault) ?? p.variants[0];
  const price = v?.price ?? p.basePrice;
  const mrp = v?.mrp ?? p.mrp;
  return mrp !== null && mrp > price;
}

function Countdown() {
  const [left, setLeft] = useState('');

  useEffect(() => {
    const tick = () => {
      const endsAt = new Date();
      endsAt.setHours(23, 59, 59, 999);
      const diff = endsAt.getTime() - Date.now();
      if (diff <= 0) {
        setLeft((prev) => (prev === 'Ended' ? prev : 'Ended'));
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const next = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      setLeft((prev) => (prev === next ? prev : next));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive" aria-live="polite">
      <Clock className="h-3.5 w-3.5" aria-hidden />
      {left}
    </span>
  );
}

interface TrendingDealsSectionProps {
  products: BuyerProductWithStore[];
  className?: string;
}

export function TrendingDealsSection({ products, className }: TrendingDealsSectionProps) {
  const deals = products.filter(hasDiscount).slice(0, 8);
  if (deals.length === 0) return null;

  // Synthetic end-of-day countdown for urgency UX
  return (
    <section className={className} aria-labelledby="trending-deals-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <SectionHeader title="Trending deals" subtitle="Limited-time offers" href="/offers" />
        <Countdown />
      </div>
      <HorizontalCarousel label="Trending deals" itemClassName="w-[168px]">
        {deals.map((product) => {
          const v = product.variants.find((x) => x.isDefault) ?? product.variants[0];
          const price = v?.price ?? product.basePrice;
          const mrp = v?.mrp ?? product.mrp;
          const pct = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
          return (
            <div key={`${product.id}-${product.store.id}`} className="relative w-[168px]">
              <ProductCard product={product} variant="carousel" showStore trackView />
              <div className="absolute bottom-[88px] left-3 rounded bg-card/90 px-1.5 py-0.5 text-[9px] font-medium text-jd-text-muted shadow-card">
                {product.store.name}
              </div>
              {pct > 0 && (
                <p className="mt-1 text-center text-[10px] font-semibold text-success">
                  {pct}% off · from {formatCurrency(price)}
                </p>
              )}
            </div>
          );
        })}
      </HorizontalCarousel>
    </section>
  );
}
