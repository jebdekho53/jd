'use client';

import { useQuery } from '@tanstack/react-query';

async function adminFetch(path: string) {
  const res = await fetch(path);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function FulfillmentNetworkAdminContent() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin', 'fulfillment-network'],
    queryFn: () => adminFetch('/api/admin/fulfillment-network'),
  });

  const { data: capacity } = useQuery({
    queryKey: ['admin', 'fulfillment-network', 'capacity'],
    queryFn: () => adminFetch('/api/admin/fulfillment-network/capacity'),
  });

  const { data: transfers } = useQuery({
    queryKey: ['admin', 'fulfillment-network', 'transfers'],
    queryFn: () => adminFetch('/api/admin/fulfillment-network/transfers'),
  });

  const { data: sla } = useQuery({
    queryKey: ['admin', 'fulfillment-network', 'sla'],
    queryFn: () => adminFetch('/api/admin/fulfillment-network/sla'),
  });

  if (isLoading) return <p className="text-sm text-slate-400">Loading control tower…</p>;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Widget label="Active Networks" value={String(dashboard?.activeNetworks ?? 0)} />
        <Widget label="Dark Stores" value={String(dashboard?.darkStores ?? 0)} />
        <Widget label="Pending Transfers" value={String(dashboard?.pendingTransfers ?? 0)} />
        <Widget label="Split Order Ratio" value={`${dashboard?.splitOrderRatio ?? 0}%`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Capacity Heatmap</h2>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {(capacity ?? []).map((c: HeatmapRow) => (
              <div key={c.storeId} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{c.storeName}</span>
                <span className={c.currentLoadPct >= 90 ? 'text-red-400' : 'text-green-400'}>
                  {Math.round(c.currentLoadPct)}% load
                </span>
              </div>
            ))}
            {(capacity ?? []).length === 0 && (
              <p className="text-xs text-slate-500">No capacity snapshots yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Fulfillment SLA</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <SlaItem label="SLA %" value={`${sla?.fulfillmentSlaPct ?? 0}%`} />
            <SlaItem label="Avg ETA" value={`${sla?.avgEtaMins ?? 0} min`} />
            <SlaItem label="Pick Time" value={`${sla?.pickTimeMins ?? 0} min`} />
            <SlaItem label="Pack Time" value={`${sla?.packTimeMins ?? 0} min`} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Transfers</h2>
        <div className="space-y-2">
          {(transfers ?? []).slice(0, 10).map((t: TransferRow) => (
            <div key={t.id} className="flex justify-between text-xs text-slate-300">
              <span>{t.fromStore?.name} → {t.toStore?.name}</span>
              <span className="text-slate-500">{t.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Recent Activity</h2>
        <div className="space-y-1">
          {(dashboard?.recentActivity ?? []).map((a: ActivityRow) => (
            <div key={a.id} className="text-xs text-slate-400">
              {a.action} · {a.store?.name ?? '—'} · {a.order?.orderNumber ?? ''}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Widget({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function SlaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-200">{value}</p>
    </div>
  );
}

interface HeatmapRow {
  storeId: string;
  storeName: string;
  currentLoadPct: number;
}

interface TransferRow {
  id: string;
  status: string;
  fromStore?: { name: string };
  toStore?: { name: string };
}

interface ActivityRow {
  id: string;
  action: string;
  store?: { name: string };
  order?: { orderNumber: string };
}
