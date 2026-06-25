'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { adminFetch, buildQuery } from '@/services/api/admin-client';

type FleetRider = {
  id: string;
  name: string;
  phone: string;
  status: string;
  vehicleType: string;
  zone: string | null;
  location: { lat: number; lng: number; lastLocationAt: string | null } | null;
  currentDelivery: { orderId: string; orderNumber: string; status: string; etaMins: number | null } | null;
};

type FleetData = {
  riders: FleetRider[];
  stats: {
    onlineRiders: number;
    busyRiders: number;
    offlineRiders: number;
    activeOrders: number;
    unassignedOrders: number;
  };
  updatedAt: string;
};

type Analytics = {
  avgEtaMins: number;
  avgDeliveryTimeMins: number;
  lateDeliveries: number;
  onlineRiders: number;
  busyRiders: number;
};

const FILTERS = ['', 'ONLINE', 'BUSY', 'OFFLINE'] as const;

async function fetchFleet(status?: string) {
  const res = await adminFetch<{ success: boolean; data: FleetData }>(
    `/api/admin/fleet/live${buildQuery({ status })}`,
  );
  return res.data;
}

async function fetchAnalytics() {
  const res = await adminFetch<{ success: boolean; data: Analytics }>(
    '/api/admin/fleet/analytics',
  );
  return res.data;
}

function FleetMap({ riders }: { riders: FleetRider[] }) {
  const width = 600;
  const height = 320;
  const padding = 20;
  const located = riders.filter((r) => r.location);

  const projected = useMemo(() => {
    if (located.length === 0) return [];
    const lats = located.map((r) => r.location!.lat);
    const lngs = located.map((r) => r.location!.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 0.01);
    const lngSpan = Math.max(maxLng - minLng, 0.01);
    return located.map((r) => {
      const lat = r.location!.lat;
      const lng = r.location!.lng;
      const x = padding + ((lng - minLng) / lngSpan) * (width - padding * 2);
      const y = padding + ((maxLat - lat) / latSpan) * (height - padding * 2);
      const color = r.status === 'ON_DELIVERY' || r.status === 'BUSY' ? '#ea580c' : '#16a34a';
      return { id: r.id, x, y, color, name: r.name };
    });
  }, [located]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-xl border bg-slate-50">
      <rect width={width} height={height} fill="#f1f5f9" />
      {projected.map((p) => (
        <g key={p.id}>
          <circle cx={p.x} cy={p.y} r="7" fill={p.color} />
          <title>{p.name}</title>
        </g>
      ))}
      {projected.length === 0 && (
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="14" fill="#64748b">
          No rider locations available
        </text>
      )}
    </svg>
  );
}

export function FleetLiveContent() {
  const [filter, setFilter] = useState('');
  const { data: fleet, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'fleet-live', filter],
    queryFn: () => fetchFleet(filter || undefined),
    refetchInterval: 10_000,
  });
  const { data: analytics } = useQuery({
    queryKey: ['admin', 'fleet-analytics'],
    queryFn: fetchAnalytics,
    refetchInterval: 60_000,
  });

  const riders = fleet?.riders ?? [];

  return (
    <DashboardShell title="Live Fleet Center">
      {analytics && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Avg ETA', value: `${analytics.avgEtaMins} min` },
            { label: 'Avg delivery', value: `${analytics.avgDeliveryTimeMins} min` },
            { label: 'Late deliveries', value: analytics.lateDeliveries },
            { label: 'Online riders', value: analytics.onlineRiders },
            { label: 'Busy riders', value: analytics.busyRiders },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-xl font-semibold">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {fleet?.stats && (
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
            Active orders: {fleet.stats.activeOrders}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
            Unassigned: {fleet.stats.unassignedOrders}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            Online: {fleet.stats.onlineRiders} · Busy: {fleet.stats.busyRiders}
          </span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f || 'ALL'}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                filter === f ? 'bg-primary text-primary-foreground' : 'border border-border'
              }`}
            >
              {f || 'ALL'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold">Fleet heatmap</h2>
        <FleetMap riders={riders} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading fleet…</p>}

      {!isLoading && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Rider</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Zone</th>
                <th className="px-3 py-2">Delivery</th>
                <th className="px-3 py-2">Location</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.zone ?? '—'}</td>
                  <td className="px-3 py-2">
                    {r.currentDelivery ? (
                      <Link href={`/orders/${r.currentDelivery.orderId}`} className="text-primary hover:underline">
                        #{r.currentDelivery.orderNumber}
                        {r.currentDelivery.etaMins != null && ` · ${r.currentDelivery.etaMins}m`}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.location
                      ? `${r.location.lat.toFixed(4)}, ${r.location.lng.toFixed(4)}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
