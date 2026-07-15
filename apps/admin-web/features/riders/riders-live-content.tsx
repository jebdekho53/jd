'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { adminFetch, buildQuery } from '@/services/api/admin-client';

type LiveRider = {
  id: string;
  name: string;
  phone: string;
  zone: string;
  status: string;
  kycStatus: string;
  vehicleType: string;
  currentDelivery: { orderNumber: string; status: string } | null;
  lastLocation: { lat: number; lng: number } | null;
  lastSeen: string;
  activeDeliveries: number;
};

const FILTERS = ['', 'ONLINE', 'OFFLINE', 'BUSY', 'SUSPENDED'] as const;

async function fetchLiveRiders(status?: string) {
  const res = await adminFetch<{ success: boolean; data: LiveRider[] }>(
    `/api/admin/rider-assignments/riders${buildQuery({ status })}`,
  );
  return res.data;
}

export function RidersLiveContent() {
  const [filter, setFilter] = useState<string>('');
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'riders-live', filter],
    queryFn: () => fetchLiveRiders(filter || undefined),
    refetchInterval: 15_000,
  });

  const riders = data ?? [];

  return (
    <DashboardShell title="Live Rider Operations">
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
        <div className="flex flex-wrap gap-2">
          <Link href="/riders/kyc" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted">
            KYC review
          </Link>
          <Link href="/riders/incentives" className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted">
            Incentives
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading riders…</p>}

      {!isLoading && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Rider</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Zone</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Current delivery</th>
                <th className="px-3 py-2">Last location</th>
                <th className="px-3 py-2">Last seen</th>
                <th className="px-3 py-2 text-center">Active</th>
              </tr>
            </thead>
            <tbody>
              {riders.map((r) => (
                <tr key={r.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-medium">{r.name}</td>
                  <td className="px-3 py-2.5">{r.phone}</td>
                  <td className="px-3 py-2.5 text-xs">{r.zone}</td>
                  <td className="px-3 py-2.5">{r.status}</td>
                  <td className="px-3 py-2.5 text-xs">
                    {r.currentDelivery
                      ? `${r.currentDelivery.orderNumber} (${r.currentDelivery.status})`
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {r.lastLocation
                      ? `${r.lastLocation.lat.toFixed(4)}, ${r.lastLocation.lng.toFixed(4)}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {new Date(r.lastSeen).toLocaleTimeString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 text-center">{r.activeDeliveries}</td>
                </tr>
              ))}
              {riders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">
                    No riders match this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Auto-refreshes every 15s ·{' '}
        <Link href="/orders/unassigned" className="text-primary hover:underline">
          Unassigned orders
        </Link>
      </p>
    </DashboardShell>
  );
}
