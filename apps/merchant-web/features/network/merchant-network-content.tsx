'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoogleStoreMap, useGoogleMaps } from '@jebdekho/google-maps';
import { useStoreStore } from '@/store/store-store';

async function fetchNetwork(path: string, storeId?: string) {
  const params = storeId ? `?storeId=${storeId}` : '';
  const res = await fetch(`/api/merchant/network/${path}${params}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
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
        <h2 className="mb-3 text-lg font-semibold">Inventory Transfers</h2>
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
  sku: string;
  suggestedQty: number;
  fromStoreName: string;
  toStoreName: string;
  reason: string;
  expectedUpliftPct: number;
}
