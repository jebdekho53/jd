'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { SectionHeader } from '@/components/v2/section-header';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { getTopDeals, getTrendingDeals } from '@/services/promotions/promotions-api';

export function TopDealsSection() {
  const { data: top = [] } = useQuery({
    queryKey: ['deals', 'top'],
    queryFn: getTopDeals,
  });
  const { data: trending = [] } = useQuery({
    queryKey: ['deals', 'trending'],
    queryFn: getTrendingDeals,
  });

  const deals = top.length > 0 ? top : trending;
  if (deals.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Top deals" href="/offers" />
      <HorizontalCarousel label="Top deals carousel">
        {deals.map((deal) => (
          <Link
            key={deal.id}
            href={`/store/${deal.store.slug}`}
            className="min-w-[200px] rounded-2xl border bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-amber-700">{deal.badge ?? 'Deal'}</p>
            <p className="mt-1 font-semibold text-slate-900">{deal.name}</p>
            <p className="text-sm text-slate-600">{deal.store.name}</p>
          </Link>
        ))}
      </HorizontalCarousel>
    </section>
  );
}
