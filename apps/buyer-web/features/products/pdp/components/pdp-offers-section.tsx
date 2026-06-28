'use client';

import Link from 'next/link';
import { BadgePercent, Sparkles, Tag, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/design-system/primitives';
import { buyerKeys, getProductOffers } from '@/services/buyer/buyer-api';

interface PdpOffersSectionProps {
  productId: string;
}

export function PdpOffersSection({ productId }: PdpOffersSectionProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: buyerKeys.productOffers(productId),
    queryFn: () => getProductOffers(productId),
    enabled: Boolean(productId),
  });

  const promotions = data?.storePromotions ?? [];
  const campaigns = data?.campaignOffers ?? [];
  const coupons = data?.coupons ?? [];
  const hasPlus = (data?.plusBenefits?.length ?? 0) > 0;
  const walletPct = data?.walletCashbackPercent;
  const personalized = data?.personalizedOffers ?? [];
  const hasOffers =
    data?.freeDeliveryEligible ||
    data?.firstOrderEligible ||
    promotions.length > 0 ||
    campaigns.length > 0 ||
    coupons.length > 0 ||
    personalized.length > 0 ||
    hasPlus ||
    walletPct != null ||
    (data?.rewardPoints != null && data.rewardPoints > 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5" aria-labelledby="pdp-offers-heading">
      <h2 id="pdp-offers-heading" className="mb-4 flex items-center gap-2 text-lg font-semibold text-jd-text-primary">
        <BadgePercent className="h-5 w-5 text-primary" aria-hidden />
        Offers & savings
      </h2>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}

      {!isLoading && !isError && !hasOffers && (
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-jd-text-muted">
          No active offers on this product right now. Check back soon or explore{' '}
          <Link href="/offers" className="font-semibold text-primary hover:underline">
            all deals
          </Link>
          .
        </p>
      )}

      {hasOffers && (
        <ul className="space-y-2">
          {data?.freeDeliveryEligible && (
            <li className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
              Free delivery eligible on this order
            </li>
          )}

          {data?.firstOrderEligible && (
            <li className="rounded-xl bg-sky-50 px-3 py-2.5 text-sm text-sky-900">
              First-order offers may apply at checkout
            </li>
          )}

          {personalized.map((o) => (
            <li key={o.id} className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-semibold text-jd-text-primary">{o.name}</p>
                {o.description && <p className="text-sm text-jd-text-muted">{o.description}</p>}
              </div>
            </li>
          ))}

          {promotions.map((o) => (
            <li key={o.id} className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50/80 p-3">
              <BadgePercent className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <div>
                <p className="font-semibold text-jd-text-primary">{o.name}</p>
                <p className="text-xs font-medium text-amber-800">{o.badge}</p>
                {o.description && <p className="text-sm text-jd-text-muted">{o.description}</p>}
              </div>
            </li>
          ))}

          {campaigns.map((o) => (
            <li key={o.id} className="flex gap-3 rounded-xl border border-violet-100 bg-violet-50/80 p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden />
              <div>
                <p className="font-semibold text-jd-text-primary">{o.name}</p>
                <p className="text-xs text-violet-800">{o.campaignName}</p>
                {o.description && <p className="text-sm text-jd-text-muted">{o.description}</p>}
              </div>
            </li>
          ))}

          {coupons.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3"
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" aria-hidden />
                <div>
                  <p className="font-mono text-sm font-bold text-primary">{c.code}</p>
                  <p className="text-xs text-jd-text-muted">{c.name}</p>
                </div>
              </div>
              <span className="text-xs text-jd-text-muted">Min ₹{c.minOrderAmount}</span>
            </li>
          ))}

          {data?.rewardPoints != null && data.rewardPoints > 0 && (
            <li className="flex gap-3 rounded-xl border border-border bg-background p-3 text-sm">
              <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-jd-text-muted" aria-hidden />
              <span>
                You have <strong>{data.rewardPoints}</strong> reward points available
              </span>
            </li>
          )}

          {walletPct != null && walletPct > 0 && data?.walletCashbackEligible !== false && (
            <li className="flex gap-3 rounded-xl border border-border bg-background p-3">
              <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-jd-text-muted" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-jd-text-primary">Wallet cashback</p>
                <p className="text-xs text-jd-text-muted">Earn up to {walletPct}% back in JebDekho Wallet</p>
              </div>
            </li>
          )}

          {hasPlus && (
            <li className="flex gap-3 rounded-xl border border-border bg-background p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-jd-text-primary">JebDekho Plus</p>
                <p className="text-xs text-jd-text-muted">
                  Active benefits: {data!.plusBenefits.join(', ').replace(/_/g, ' ').toLowerCase()}
                </p>
              </div>
            </li>
          )}
        </ul>
      )}

      {hasOffers && (
        <Link href="/offers" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          View all offers →
        </Link>
      )}
    </section>
  );
}
