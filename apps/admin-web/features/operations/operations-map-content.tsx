'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useGoogleMaps } from '@jebdekho/google-maps';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { OpsMapOverlay } from '@/features/maps/ops-map-overlay';
import { useOperationsMapQuery } from '@/features/maps/use-operations-map';

type OpsMapData = import('@/features/maps/use-operations-map').OpsMapData;

function OpsSvgMap({ data }: { data: OpsMapData }) {
  const width = 720;
  const height = 400;
  const padding = 24;

  const points = useMemo(() => {
    const pts: Array<{ lat: number; lng: number; color: string; label: string }> = [];
    for (const s of data.stores) {
      pts.push({ lat: s.latitude, lng: s.longitude, color: '#0284c7', label: s.name });
    }
    for (const r of data.fleet.riders) {
      if (r.location) {
        pts.push({
          lat: r.location.lat,
          lng: r.location.lng,
          color: r.currentDelivery ? '#ea580c' : '#16a34a',
          label: r.name,
        });
      }
    }
    for (const o of data.unassignedOrders) {
      pts.push({ lat: o.deliveryLat, lng: o.deliveryLng, color: '#dc2626', label: o.orderNumber });
    }
    return pts;
  }, [data]);

  const projected = useMemo(() => {
    if (points.length === 0) return [];
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 0.01);
    const lngSpan = Math.max(maxLng - minLng, 0.01);
    return points.map((p) => ({
      ...p,
      x: padding + ((p.lng - minLng) / lngSpan) * (width - padding * 2),
      y: padding + ((maxLat - p.lat) / latSpan) * (height - padding * 2),
    }));
  }, [points]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-xl border bg-slate-50">
      {data.zones.map((z) => {
        const cx = padding + width * 0.5;
        const cy = padding + height * 0.5;
        return (
          <circle
            key={z.id}
            cx={cx}
            cy={cy}
            r={z.radiusKm * 8}
            fill="none"
            stroke="#94a3b8"
            strokeDasharray="4 4"
            opacity={0.4}
          />
        );
      })}
      {projected.map((p) => (
        <circle key={`${p.label}-${p.x}`} cx={p.x} cy={p.y} r={5} fill={p.color}>
          <title>{p.label}</title>
        </circle>
      ))}
    </svg>
  );
}

export function OperationsMapContent() {
  const { isConfigured, isLoaded } = useGoogleMaps();
  const { data, isLoading, refetch, isFetching } = useOperationsMapQuery(15_000);

  return (
    <DashboardShell title="Operations Map">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Live stores, riders, zones, franchise territories, unassigned orders and active deliveries
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-lg border px-3 py-1.5 text-sm"
          >
            Refresh
          </button>
        </div>

        {isLoading && <div className="h-96 animate-pulse rounded-xl bg-slate-100" />}
        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Online riders" value={data.fleet.stats.onlineRiders} />
              <Stat label="Busy riders" value={data.fleet.stats.busyRiders} />
              <Stat label="Active orders" value={data.fleet.stats.activeOrders} />
              <Stat label="Unassigned" value={data.fleet.stats.unassignedOrders} />
            </div>
            <div className="mb-3 flex flex-wrap gap-3 text-xs">
              <Legend color="#0284c7" label="Stores" />
              <Legend color="#16a34a" label="Riders (idle)" />
              <Legend color="#ea580c" label="Riders (busy)" />
              <Legend color="#8b5cf6" label="Exclusive territory" />
              <Legend color="#6366f1" label="Shared territory" />
            </div>
            {isConfigured && isLoaded ? (
              <OpsMapOverlay data={data} showFranchise />
            ) : (
              <OpsSvgMap data={data} />
            )}
            {(data.franchiseTerritories ?? []).length > 0 && (
              <Panel title="Franchise territories">
                <ul className="space-y-1 text-sm">
                  {(data.franchiseTerritories ?? []).map((t) => (
                    <li key={t.id} style={{ color: t.color }}>
                      {t.franchise.businessName} — {t.city}, {t.state}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            {(data.riderClusters ?? []).length > 0 && (
              <Panel title="Rider clusters">
                <ul className="space-y-1 text-sm">
                  {(data.riderClusters ?? []).map((c: { id: string; locality: string; city: string; demandSupplyRatio: number; color: string }) => (
                    <li key={c.id} style={{ color: c.color }}>
                      {c.locality}, {c.city} — ratio {c.demandSupplyRatio}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            {(data.fleetAlerts ?? []).length > 0 && (
              <Panel title="Fleet alerts">
                {(data.fleetAlerts ?? []).map((a: { id: string; message: string }) => (
                  <p key={a.id} className="text-sm text-amber-700">{a.message}</p>
                ))}
              </Panel>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Unassigned orders">
                {data.unassignedOrders.length === 0 ? (
                  <p className="text-sm text-slate-500">None</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {data.unassignedOrders.map((o) => (
                      <li key={o.id}>
                        <Link href={`/orders/${o.id}`} className="text-brand-600 hover:underline">
                          {o.orderNumber}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
              <Panel title="Active deliveries">
                {data.activeDeliveries.length === 0 ? (
                  <p className="text-sm text-slate-500">None in transit</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {data.activeDeliveries.map((d) => (
                      <li key={d.riderId}>
                        {d.riderName} → {d.order.orderNumber}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-2 font-medium">{title}</h3>
      {children}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
