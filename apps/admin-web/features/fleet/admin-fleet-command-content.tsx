'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';

async function fetchFleet() {
  const res = await fetch('/api/admin/fleet-os/overview');
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function AdminFleetCommandContent() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'fleet-os'],
    queryFn: fetchFleet,
    refetchInterval: 15_000,
  });

  return (
    <DashboardShell title="Fleet Command Center">
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => refetch()} disabled={isFetching} className="rounded-lg border px-3 py-1.5 text-sm">
          Refresh
        </button>
      </div>
      {isLoading && <p className="text-sm text-slate-500">Loading fleet OS…</p>}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Online riders" value={data.fleet?.stats?.onlineRiders ?? 0} />
            <Stat label="Active batches" value={data.batches?.length ?? 0} />
            <Stat label="Open alerts" value={data.alerts?.length ?? 0} />
            <Stat label="Route efficiency" value={`${data.metrics?.routeEfficiency ?? 0}%`} />
          </div>

          <Panel title="Rider clusters">
            {(data.clusters ?? []).slice(0, 10).map((c: { id: string; city: string; locality: string; activeRiders: number; activeOrders: number; demandSupplyRatio: number }) => (
              <Row key={c.id} left={`${c.locality}, ${c.city}`} right={`${c.activeRiders} riders · ${c.activeOrders} orders · ratio ${c.demandSupplyRatio}`} />
            ))}
          </Panel>

          <Panel title="Batch deliveries">
            {(data.batches ?? []).map((b: { id: string; rider: { name: string }; totalOrders: number; status: string }) => (
              <Row key={b.id} left={b.rider.name} right={`${b.totalOrders} orders · ${b.status}`} />
            ))}
            {(data.batches ?? []).length === 0 && <p className="text-sm text-slate-500">No active batches</p>}
          </Panel>

          <Panel title="Fleet alerts">
            {(data.alerts ?? []).map((a: { id: string; alertType: string; message: string }) => (
              <div key={a.id} className="text-sm text-amber-700">{a.alertType}: {a.message}</div>
            ))}
          </Panel>
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between border-b py-2 text-sm last:border-0">
      <span>{left}</span>
      <span className="text-slate-500">{right}</span>
    </div>
  );
}
