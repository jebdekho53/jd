'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { SectionHeader } from '@/components/v2/section-header';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { formatCurrency } from '@/lib/utils';

export function RecentlyViewedRail() {
  const { items } = useRecentlyViewed();
  if (items.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Recently viewed" subtitle="Pick up where you left off" />
      <HorizontalCarousel label="Recently viewed" itemClassName="w-[136px]">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.id}`}
            className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card card-hover"
          >
            <div className="relative aspect-square bg-cream-3">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="136px"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full place-items-center text-jd-text-muted">
                  <Package className="h-7 w-7" aria-hidden />
                </div>
              )}
            </div>
            <div className="p-2.5">
              <p className="line-clamp-2 text-xs font-medium leading-tight text-jd-text-primary group-hover:text-primary">
                {item.name}
              </p>
              <p className="mt-1 text-sm font-bold text-jd-text-primary">
                {formatCurrency(item.price)}
              </p>
            </div>
          </Link>
        ))}
      </HorizontalCarousel>
    </section>
  );
}
