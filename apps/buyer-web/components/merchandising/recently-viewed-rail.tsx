'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock3, Package, Scale, Star } from 'lucide-react';
import { SectionHeader } from '@/components/v2/section-header';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { formatCurrency } from '@/lib/utils';

export function RecentlyViewedRail() {
  const { items } = useRecentlyViewed();
  if (items.length === 0) {
    return (
      <section>
        <SectionHeader title="Recently viewed" subtitle="Your quick picks will appear here" />
        <div className="rounded-3xl border border-dashed border-primary/25 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-card">
              <Clock3 className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-jd-text-primary">Browse products to build your shelf</p>
              <p className="mt-1 text-xs leading-5 text-jd-text-muted">
                We&apos;ll keep your latest products here with prices so you can compare and reorder faster.
              </p>
              <Link
                href="/search"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-secondary"
              >
                Start searching
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title="Recently viewed" subtitle="Pick up where you left off" />
      <HorizontalCarousel label="Recently viewed" itemClassName="w-[174px] sm:w-[190px]">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.id}`}
            className="group block overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="relative aspect-[4/3] bg-cream-3">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="190px"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full place-items-center text-jd-text-muted">
                  <Package className="h-7 w-7" aria-hidden />
                </div>
              )}
            </div>
            <div className="space-y-2 p-3">
              <p className="line-clamp-2 min-h-8 text-xs font-bold leading-tight text-jd-text-primary group-hover:text-primary">
                {item.name}
              </p>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-base font-black text-jd-text-primary">{formatCurrency(item.price)}</p>
                  <p className="text-[10px] text-jd-text-muted">{item.unit}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                  <Scale className="h-3 w-3" aria-hidden />
                  Compare
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2 text-[10px] text-jd-text-muted">
                <span className="line-clamp-1">{item.storeName ?? 'Nearby stores'}</span>
                <span className="inline-flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                  4.5
                </span>
              </div>
            </div>
          </Link>
        ))}
      </HorizontalCarousel>
    </section>
  );
}
