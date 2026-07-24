'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GoogleStoreMap, useGoogleMaps } from '@jebdekho/google-maps';
import { useStoreStore } from '@/store/store-store';
import { useStoresQuery } from '@/hooks/use-stores';
import { listProducts } from '@/services/products/products-api';

async function fetchNetwork(path: string, storeId?: string) {
  const params = storeId ? `?storeId=${storeId}` : '';
  const res = await fetch(`/api/merchant/network/${path}${params}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

async function postInventory(path: string, body: unknown) {
  const res = await fetch(`/api/merchant/inventory/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

async function patchInventory(path: string) {
  const res = await fetch(`/api/merchant/inventory/${path}`, { method: 'PATCH' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

interface TransferLineItem {
  variantId: string;
  sku: string;
  label: string;
  quantity: number;
}

const STORE_TYPE_LABEL: Record<string, string> = {
  RETAIL_STORE: 'Retail',
  DARK_STORE: 'Dark Store',
  WAREHOUSE: 'Warehouse',
  MICRO_FULFILLMENT_CENTER: 'Micro FC',
};

export function MerchantNetworkContent() {
  const { currentStore } = useStoreStore();
  const storeId = currentStore?.id;
  const qc = useQueryClient();

  const [showTransferForm, setShowTransferForm] = useState(false);
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [lineItems, setLineItems] = useState<TransferLineItem[]>([]);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: stores } = useStoresQuery();

  const { data: fromStoreProducts } = useQuery({
    queryKey: ['merchant', 'network', 'transfer-products', fromStoreId],
    queryFn: () => listProducts(fromStoreId),
    enabled: !!fromStoreId && showTransferForm,
  });

  const variantOptions = useMemo(() => {
    const opts: { variantId: string; sku: string; label: string }[] = [];
    for (const p of fromStoreProducts?.data ?? []) {
      for (const v of p.variants ?? []) {
        opts.push({
          variantId: v.id,
          sku: v.sku,
          label: `${p.name} — ${v.name} (${v.sku}) · stock ${v.inventory?.availableQty ?? 0}`,
        });
      }
    }
    return opts;
  }, [fromStoreProducts]);

  function addLineItem() {
    const variant = variantOptions.find((v) => v.variantId === selectedVariant);
    const qty = Number(quantity);
    if (!variant || !qty || qty < 1) return;
    setLineItems((items) => [
      ...items.filter((i) => i.variantId !== variant.variantId),
      { variantId: variant.variantId, sku: variant.sku, label: variant.label, quantity: qty },
    ]);
    setSelectedVariant('');
    setQuantity('1');
  }

  const createTransfer = useMutation({
    mutationFn: () =>
      postInventory('transfers', {
        fromStoreId,
        toStoreId,
        notes: notes || undefined,
        items: lineItems.map((i) => ({ variantId: i.variantId, sku: i.sku, quantity: i.quantity })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['merchant', 'network', 'transfers'] });
      setShowTransferForm(false);
      setLineItems([]);
      setNotes('');
      setFromStoreId('');
      setToStoreId('');
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const approveTransfer = useMutation({
    mutationFn: (id: string) => patchInventory(`transfers/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant', 'network', 'transfers'] }),
  });

  const completeTransfer = useMutation({
    mutationFn: (id: string) => patchInventory(`transfers/${id}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant', 'network', 'transfers'] }),
  });

  function submitTransfer() {
    setFormError(null);
    if (!fromStoreId || !toStoreId) return setFormError('Select both stores');
    if (fromStoreId === toStoreId) return setFormError('Source and destination must differ');
    if (lineItems.length === 0) return setFormError('Add at least one item');
    createTransfer.mutate();
  }

  const { data: overview, isLoading } = useQuery({
    queryKey: ['merchant', 'network', 'overview', storeId],
    queryFn: () => fetchNetwork('overview', storeId),
    enabled: !!storeId,
  });

  const { data: capacity } = useQuery({
    queryKey: ['merchant', 'network', 'capacity', storeId],
    queryFn: () => fetchNetwork('capacity', storeId),
    enabled: !!storeId,
  });

  const { data: transfers } = useQuery({
    queryKey: ['merchant', 'network', 'transfers', storeId],
    queryFn: () => fetchNetwork('transfers', storeId),
    enabled: !!storeId,
  });

  const { data: rebalancing } = useQuery({
    queryKey: ['merchant', 'network', 'rebalancing', storeId],
    queryFn: () => fetchNetwork('rebalancing', storeId),
    enabled: !!storeId,
  });

  const { data: performance } = useQuery({
    queryKey: ['merchant', 'network', 'performance', storeId],
    queryFn: () => fetchNetwork('performance', storeId),
    enabled: !!storeId,
  });

  const { isConfigured, isLoaded } = useGoogleMaps();

  const hubStores = useMemo(() => {
    return (overview?.stores ?? []).filter((s: NetworkStore) =>
      ['DARK_STORE', 'WAREHOUSE', 'MICRO_FULFILLMENT_CENTER'].includes(s.storeType),
    );
  }, [overview?.stores]);

  const mapCenter = useMemo(() => {
    const stores = overview?.stores ?? [];
    if (stores.length === 0) return null;
    const valid = stores.filter((s: NetworkStore) => s.latitude != null && s.longitude != null);
    if (valid.length === 0) return null;
    const lat = valid.reduce((s: number, st: NetworkStore) => s + st.latitude!, 0) / valid.length;
    const lng = valid.reduce((s: number, st: NetworkStore) => s + st.longitude!, 0) / valid.length;
    return { lat, lng };
  }, [overview?.stores]);

  if (!storeId) {
    return <p className="text-sm text-slate-500">Select a store to view your fulfillment network.</p>;
  }

  if (isLoading) return <p className="text-sm text-slate-500">Loading network…</p>;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Network" value={overview?.networkName ?? '—'} />
        <StatCard label="Dark Stores" value={String(overview?.darkStores ?? 0)} />
        <StatCard label="Warehouses" value={String(overview?.warehouses ?? 0)} />
        <StatCard label="Split Orders" value={`${overview?.splitOrderRatio ?? 0}%`} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Warehouse & dark-store map</h2>
        {overview?.stores && overview.stores.length === 0 ? (
          <p className="text-sm text-slate-500">
            Add a store to view network coverage.
          </p>
        ) : !mapCenter && overview?.stores && overview.stores.length > 0 ? (
          <p className="text-sm text-slate-500">
            Store coordinates missing. Please update hub locations to view map.
          </p>
        ) : hubStores.length > 0 && mapCenter && isConfigured && isLoaded ? (
          <GoogleStoreMap
            buyerLat={mapCenter.lat}
            buyerLng={mapCenter.lng}
            stores={hubStores.map((s: NetworkStore) => ({
              id: s.id,
              name: s.name,
              lat: s.latitude,
              lng: s.longitude,
            }))}
          />
        ) : (
          <p className="text-sm text-slate-500">
            {hubStores.length === 0
              ? 'No warehouse or dark-store hubs in your network yet.'
              : 'Enable Google Maps to view hub locations on the map.'}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Stores & Hubs</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(overview?.stores ?? []).map((s: NetworkStore) => (
            <div key={s.id} className="rounded-xl border bg-white p-4">
              <p className="font-medium text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-500">{STORE_TYPE_LABEL[s.storeType] ?? s.storeType}</p>
              <p className="mt-1 text-xs text-slate-400">
                {s.isActive ? 'Active' : 'Inactive'} · {s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Capacity</h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2">Store</th>
                <th className="px-4 py-2">Load %</th>
                <th className="px-4 py-2">Backlog</th>
                <th className="px-4 py-2">Pickers</th>
              </tr>
            </thead>
            <tbody>
              {(capacity ?? []).map((c: CapacityRow) => (
                <tr key={c.storeId} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{c.storeId.slice(-6)}</td>
                  <td className="px-4 py-2">
                    <LoadBar pct={c.currentLoadPct} />
                  </td>
                  <td className="px-4 py-2">{c.backlogCount}</td>
                  <td className="px-4 py-2">{c.pickersAvailable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Inventory Transfers</h2>
          <button
            type="button"
            onClick={() => {
              setShowTransferForm((s) => !s);
              setFormError(null);
            }}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            {showTransferForm ? 'Cancel' : 'Create transfer'}
          </button>
        </div>

        {showTransferForm && (
          <div className="mb-4 space-y-3 rounded-xl border bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={fromStoreId}
                onChange={(e) => {
                  setFromStoreId(e.target.value);
                  setLineItems([]);
                }}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">From store…</option>
                {(stores?.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select
                value={toStoreId}
                onChange={(e) => setToStoreId(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">To store…</option>
                {(stores?.data ?? []).filter((s) => s.id !== fromStoreId).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {fromStoreId && (
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="min-w-64 flex-1 rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">Select a product…</option>
                  {variantOptions.map((v) => (
                    <option key={v.variantId} value={v.variantId}>{v.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-20 rounded-lg border px-2 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addLineItem}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white"
                >
                  Add item
                </button>
              </div>
            )}

            {lineItems.length > 0 && (
              <div className="space-y-1">
                {lineItems.map((item) => (
                  <div key={item.variantId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <span>{item.label} × {item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setLineItems((items) => items.filter((i) => i.variantId !== item.variantId))}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <button
              type="button"
              onClick={submitTransfer}
              disabled={createTransfer.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {createTransfer.isPending ? 'Creating…' : 'Submit transfer'}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {(transfers ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No transfers yet.</p>
          )}
          {(transfers ?? []).map((t: TransferRow) => (
            <div key={t.id} className="rounded-xl border bg-white p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span>{t.fromStore?.name} → {t.toStore?.name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{t.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{t.items?.length ?? 0} SKU(s)</p>
              <div className="mt-2 flex gap-2">
                {t.status === 'REQUESTED' && (
                  <button
                    type="button"
                    onClick={() => approveTransfer.mutate(t.id)}
                    className="rounded bg-brand-600 px-2 py-1 text-xs text-white"
                  >
                    Approve
                  </button>
                )}
                {(t.status === 'APPROVED' || t.status === 'IN_TRANSIT') && (
                  <button
                    type="button"
                    onClick={() => completeTransfer.mutate(t.id)}
                    className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                  >
                    Mark received
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Rebalancing Suggestions</h2>
        <div className="space-y-2">
          {(rebalancing ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No rebalancing suggestions right now.</p>
          )}
          {(rebalancing ?? []).map((r: RebalanceRow) => (
            <div key={r.id} className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-sm">
              <p className="font-medium">Transfer {r.suggestedQty} × {r.sku}</p>
              <p className="text-slate-600">{r.fromStoreName} → {r.toStoreName}</p>
              <p className="mt-1 text-xs text-slate-500">{r.reason}</p>
              <p className="text-xs text-brand-700">Expected uplift +{r.expectedUpliftPct}%</p>
              <button
                type="button"
                onClick={async () => {
                  const products = await listProducts(r.fromStoreId);
                  const variant = products.data
                    .flatMap((p) => p.variants ?? [])
                    .find((v) => v.sku === r.sku);
                  if (!variant) return;
                  setFromStoreId(r.fromStoreId);
                  setToStoreId(r.toStoreId);
                  setLineItems([
                    {
                      variantId: variant.id,
                      sku: variant.sku,
                      label: `${variant.name} (${variant.sku})`,
                      quantity: r.suggestedQty,
                    },
                  ]);
                  setShowTransferForm(true);
                }}
                className="mt-2 rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600"
              >
                Start transfer
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Fulfillment Performance</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Accuracy" value={`${performance?.fulfillmentAccuracy ?? 0}%`} />
          <StatCard label="Avg Pick" value={`${performance?.avgPickTimeMins ?? 0} min`} />
          <StatCard label="Dark Store Orders" value={String(performance?.darkStorePerformance ?? 0)} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function LoadBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs">{Math.round(pct)}%</span>
    </div>
  );
}

interface NetworkStore {
  id: string;
  name: string;
  storeType: string;
  isActive: boolean;
  latitude: number;
  longitude: number;
}

interface CapacityRow {
  storeId: string;
  currentLoadPct: number;
  backlogCount: number;
  pickersAvailable: number;
}

interface TransferRow {
  id: string;
  status: string;
  fromStore?: { name: string };
  toStore?: { name: string };
  items?: unknown[];
}

interface RebalanceRow {
  id: string;
  fromStoreId: string;
  toStoreId: string;
  sku: string;
  suggestedQty: number;
  fromStoreName: string;
  toStoreName: string;
  reason: string;
  expectedUpliftPct: number;
}
