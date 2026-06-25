'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { merchantFetch } from '@/services/api/merchant-client';
import { useStoreStore } from '@/store/store-store';
import { Button, Card, CardBody, Spinner } from '@/design-system/primitives';

interface PromotionRow {
  id: string;
  name: string;
  offerType: string;
  discountValue: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
}

interface Overview {
  activePromotions: number;
  totalUsages: number;
  totalDiscountGiven: number;
  ordersInfluenced: number;
}

export function PromotionsPageContent() {
  const { currentStore } = useStoreStore();
  const storeId = currentStore?.id;
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [offerType, setOfferType] = useState('PERCENTAGE_DISCOUNT');
  const [discountValue, setDiscountValue] = useState('10');
  const qc = useQueryClient();

  const overview = useQuery({
    queryKey: ['merchant', 'promotions', 'overview', storeId],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: Overview }>(
        `/api/merchant/stores/${storeId}/promotions/overview`,
      );
      return res.data;
    },
    enabled: Boolean(storeId),
  });

  const list = useQuery({
    queryKey: ['merchant', 'promotions', storeId],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: PromotionRow[] }>(
        `/api/merchant/stores/${storeId}/promotions?limit=50`,
      );
      return res.data;
    },
    enabled: Boolean(storeId),
  });

  const create = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await merchantFetch(`/api/merchant/stores/${storeId}/promotions`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          offerType,
          target: 'STORE_WIDE',
          discountValue: Number(discountValue),
          startsAt: now.toISOString(),
          expiresAt: expires.toISOString(),
        }),
      });
    },
    onSuccess: () => {
      setShowForm(false);
      setName('');
      qc.invalidateQueries({ queryKey: ['merchant', 'promotions'] });
    },
  });

  const pause = useMutation({
    mutationFn: (id: string) =>
      merchantFetch(`/api/merchant/stores/${storeId}/promotions/${id}/pause`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant', 'promotions'] }),
  });

  if (!storeId) {
    return <p className="text-sm text-slate-500">Select a store to manage promotions.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Promotions</h1>
          <p className="text-sm text-slate-500">{currentStore?.name}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>Create offer</Button>
      </div>

      {overview.isLoading ? (
        <Spinner />
      ) : overview.data ? (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardBody><p className="text-xs text-slate-500">Active</p><p className="text-2xl font-bold">{overview.data.activePromotions}</p></CardBody></Card>
          <Card><CardBody><p className="text-xs text-slate-500">Usages</p><p className="text-2xl font-bold">{overview.data.totalUsages}</p></CardBody></Card>
          <Card><CardBody><p className="text-xs text-slate-500">Discount given</p><p className="text-2xl font-bold">₹{overview.data.totalDiscountGiven}</p></CardBody></Card>
          <Card><CardBody><p className="text-xs text-slate-500">Orders influenced</p><p className="text-2xl font-bold">{overview.data.ordersInfluenced}</p></CardBody></Card>
        </div>
      ) : null}

      {showForm && (
        <Card>
          <CardBody className="space-y-3">
            <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Offer name" value={name} onChange={(e) => setName(e.target.value)} />
            <select className="w-full rounded border px-3 py-2 text-sm" value={offerType} onChange={(e) => setOfferType(e.target.value)}>
              <option value="PERCENTAGE_DISCOUNT">Percentage discount</option>
              <option value="FLAT_DISCOUNT">Flat discount</option>
              <option value="FREE_DELIVERY">Free delivery</option>
              <option value="BUY_X_GET_Y">Buy X Get Y</option>
            </select>
            <input className="w-full rounded border px-3 py-2 text-sm" type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
            <Button onClick={() => create.mutate()} loading={create.isPending}>Save offer</Button>
          </CardBody>
        </Card>
      )}

      <ul className="space-y-2">
        {(list.data ?? []).map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-xl border bg-white p-4">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-slate-500">{p.offerType} · Used {p.usedCount}×</p>
            </div>
            {p.isActive && (
              <Button size="sm" variant="outline" onClick={() => pause.mutate(p.id)}>Pause</Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
