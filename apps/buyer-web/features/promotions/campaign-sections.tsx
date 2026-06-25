'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { SectionHeader } from '@/components/v2/section-header';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { getFlashSales, getOffersNearYou, getRecommendedOffers } from '@/services/promotions/promotions-api';
import { useEffectiveLocation } from '@/store/location-store';

function Countdown({ expiresAt }: { expiresAt: string }) {
  const end = new Date(expiresAt).getTime();
  const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return (
    <span className="font-mono text-xs text-red-600">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

export function FlashSalesSection() {
  const { data: sales = [] } = useQuery({ queryKey: ['offers', 'flash'], queryFn: () => getFlashSales(8) });
  if (sales.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Flash sales" subtitle="Limited quantity — ends soon" href="/offers" />
      <HorizontalCarousel label="Flash sales">
        {sales.map((sale) => (
          <Link
            key={sale.id}
            href={sale.store ? `/stores/${sale.store.slug}` : '/offers'}
            className="min-w-[220px] rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Flash
              </span>
              <Countdown expiresAt={sale.expiresAt} />
            </div>
            <p className="mt-2 font-semibold">{sale.name}</p>
            <p className="text-sm text-slate-600">{sale.badge}</p>
            {sale.flashQtyRemaining != null && (
              <p className="mt-1 text-xs text-red-700">{sale.flashQtyRemaining} left</p>
            )}
          </Link>
        ))}
      </HorizontalCarousel>
    </section>
  );
}

export function OffersNearYouSection() {
  const { lat, lng } = useEffectiveLocation();
  const { data: offers = [] } = useQuery({
    queryKey: ['offers', 'near', lat, lng],
    queryFn: () => getOffersNearYou(lat!, lng!),
    enabled: Boolean(lat && lng),
  });
  if (!lat || !lng || offers.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Offers near you" href="/offers" />
      <HorizontalCarousel label="Offers near you">
        {offers.map((o) => (
          <Link
            key={o.id}
            href={o.store ? `/stores/${o.store.slug}` : '/offers'}
            className="min-w-[200px] rounded-2xl border bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-emerald-700">{o.badge}</p>
            <p className="mt-1 font-semibold">{o.name}</p>
            {o.store && <p className="text-sm text-slate-600">{o.store.name}</p>}
          </Link>
        ))}
      </HorizontalCarousel>
    </section>
  );
}

export function RecommendedDealsSection({ buyerProfileId }: { buyerProfileId?: string }) {
  const { lat, lng } = useEffectiveLocation();
  const { data: deals = [] } = useQuery({
    queryKey: ['offers', 'recommended', buyerProfileId, lat, lng],
    queryFn: () => getRecommendedOffers(buyerProfileId!, lat ?? undefined, lng ?? undefined),
    enabled: Boolean(buyerProfileId),
  });
  if (!buyerProfileId || deals.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Recommended for you" href="/offers" />
      <HorizontalCarousel label="Recommended deals">
        {deals.map((d) => (
          <Link
            key={d.id}
            href={d.store ? `/stores/${d.store.slug}` : '/offers'}
            className="min-w-[200px] rounded-2xl border bg-violet-50 p-4"
          >
            <p className="text-xs text-violet-700">Personalized</p>
            <p className="font-semibold">{d.name}</p>
            <p className="text-sm">{d.badge}</p>
          </Link>
        ))}
      </HorizontalCarousel>
    </section>
  );
}
