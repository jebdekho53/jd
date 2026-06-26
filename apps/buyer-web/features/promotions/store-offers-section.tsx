'use client';

import { useState } from 'react';
import { Tag, Percent } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getStoreCoupons, getStoreOffers } from '@/services/promotions/promotions-api';
import { Badge } from '@/components/ui/badge';

export function StoreOffersSection({ storeSlug }: { storeSlug: string }) {
  const offers = useQuery({
    queryKey: ['store', storeSlug, 'offers'],
    queryFn: () => getStoreOffers(storeSlug),
  });
  const coupons = useQuery({
    queryKey: ['store', storeSlug, 'coupons'],
    queryFn: () => getStoreCoupons(storeSlug),
  });

  const offerList = offers.data ?? [];
  const couponList = coupons.data ?? [];
  if (offerList.length === 0 && couponList.length === 0) return null;

  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-card">
      <h2 className="text-lg font-semibold text-jd-text-primary">Offers & coupons</h2>
      {offerList.length > 0 && (
        <ul className="space-y-2">
          {offerList.map((o) => (
            <li key={o.id} className="flex items-start gap-3 rounded-xl bg-amber-50 p-3">
              <Percent className="mt-0.5 h-4 w-4 text-amber-600" />
              <div>
                <p className="font-medium text-slate-900">{o.name}</p>
                {o.description && <p className="text-sm text-slate-600">{o.description}</p>}
                <Badge variant="secondary" className="mt-1">
                  {o.badge ?? o.offerType.replace(/_/g, ' ')}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
      {couponList.length > 0 && (
        <ul className="space-y-2">
          {couponList.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-xl border border-dashed p-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-mono text-sm font-bold">{c.code}</p>
                  <p className="text-xs text-slate-500">{c.name}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">Min ₹{c.minOrderAmount}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
