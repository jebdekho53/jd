'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { SectionHeader } from '@/components/v2/section-header';
import { formatCurrency } from '@/lib/utils';

interface SponsoredProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  imageUrls: string[];
  campaignId: string;
}

/** Fire-and-forget ad click tracking — never blocks navigation. */
function recordAdClick(campaignId: string) {
  void fetch('/api/buyer/ads/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Sponsored (paid) product rail on the home page. Impressions are recorded
 * server-side when the endpoint serves the items; clicks are recorded on tap.
 * Renders nothing when there are no active sponsored campaigns.
 */
export function SponsoredRail() {
  const { data } = useQuery({
    queryKey: ['home', 'sponsored'],
    queryFn: async (): Promise<SponsoredProduct[]> => {
      const res = await fetch('/api/buyer/ads/sponsored', { cache: 'no-store' });
      if (!res.ok) return [];
      const body = (await res.json()) as { products?: SponsoredProduct[] };
      return body.products ?? [];
    },
    staleTime: 60_000,
  });

  const products = data ?? [];
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="sponsored-rail">
      <SectionHeader title="Featured for you" subtitle="Sponsored" />
      <HorizontalCarousel label="Sponsored products" itemClassName="w-[152px] sm:w-[168px]">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}?q=${encodeURIComponent(product.name)}`}
            onClick={() => recordAdClick(product.campaignId)}
            className="group block overflow-hidden rounded-xl border border-border bg-card shadow-card"
          >
            <div className="relative aspect-square bg-cream-3">
              {product.imageUrls?.[0] ? (
                <Image
                  src={product.imageUrls[0]}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="168px"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl font-bold text-primary/20">
                  {product.name.charAt(0)}
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-md bg-slate-800/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Ad
              </span>
            </div>
            <div className="space-y-1 p-2">
              <p className="line-clamp-2 text-xs font-medium text-jd-text-primary">{product.name}</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(product.basePrice)}</p>
            </div>
          </Link>
        ))}
      </HorizontalCarousel>
    </section>
  );
}
