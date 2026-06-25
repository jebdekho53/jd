'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listPromotions, suspendCoupon, createPlatformCampaign } from '@/services/admin-api';
import { Button } from '@/design-system';

export function PromotionsAdminContent() {
  const [tab, setTab] = useState<'all' | 'active' | 'expired'>('all');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'promotions', tab],
    queryFn: () => listPromotions({ status: tab === 'all' ? undefined : tab }),
  });

  const suspend = useMutation({
    mutationFn: (id: string) => suspendCoupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promotions'] }),
  });

  const promotions = data?.promotions ?? [];
  const coupons = data?.coupons ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Platform-wide promotion and coupon control.</p>
      <div className="flex gap-2">
        {(['all', 'active', 'expired'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
              tab === t ? 'bg-admin-800 text-white' : 'bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      <section>
        <h3 className="mb-2 font-semibold">Store promotions</h3>
        <ul className="space-y-2">
          {promotions.map((p) => (
            <li key={p.id} className="rounded-xl border bg-white p-4">
              <p className="font-medium">{p.store?.name} — {p.name}</p>
              <p className="text-sm text-slate-600">{p.offerType} · {p.usedCount} uses</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Coupons</h3>
        <ul className="space-y-2">
          {coupons.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-xl border bg-white p-4">
              <div>
                <p className="font-mono font-medium">{c.code}</p>
                <p className="text-sm text-slate-600">{c.name} · {c.usedCount} redemptions</p>
              </div>
              {c.isActive && (
                <Button size="sm" variant="outline" onClick={() => suspend.mutate(c.id)}>Suspend</Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
