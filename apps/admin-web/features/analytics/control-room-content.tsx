'use client';

import Link from 'next/link';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AdminMetricCard, AdminSection, HealthPill } from '@/components/dashboard/dashboard-widgets';
import { useControlRoomQuery } from '@/hooks/use-analytics';

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function ControlRoomContent() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useControlRoomQuery();
  const d = data;

  return (
    <DashboardShell title="Real-time Control Room">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Live operations board · polls every 15s (WebSocket on API namespace /analytics)
        </p>
        <Link href="/analytics" className="text-sm font-medium text-primary hover:underline">
          BI Analytics →
        </Link>
      </div>
      {isError && (
        <p className="mb-4 text-sm text-red-600">
          Failed to load control room.{' '}
          <button type="button" onClick={() => refetch()} className="underline">
            Retry
          </button>
        </p>
      )}

      <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
        <HealthPill label={`API ${d?.systemHealth.api ?? '—'}`} status={d?.systemHealth.api === 'ok' ? 'up' : 'down'} />
        <HealthPill label={`DB ${d?.systemHealth.db ?? '—'}`} status={d?.systemHealth.db === 'ok' ? 'up' : 'down'} />
        <span>Updated {d?.updatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}</span>
      </div>

      <AdminSection title="Live operations">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard label="Active orders" value={d?.orders.active ?? '—'} loading={isLoading} href="/orders" />
          <AdminMetricCard label="Orders today" value={d?.orders.today ?? '—'} loading={isLoading} />
          <AdminMetricCard label="Unassigned" value={d?.orders.unassigned ?? '—'} loading={isLoading} href="/orders/unassigned" />
          <AdminMetricCard label="Revenue today" value={formatInr(d?.revenue.today ?? 0)} loading={isLoading} />
          <AdminMetricCard label="Revenue last hour" value={formatInr(d?.revenue.lastHour ?? 0)} loading={isLoading} />
          <AdminMetricCard label="Online riders" value={d?.riders.online ?? '—'} loading={isLoading} href="/riders/live" />
          <AdminMetricCard label="Busy riders" value={d?.riders.busy ?? '—'} loading={isLoading} />
          <AdminMetricCard label="Preparing orders" value={d?.storeActivity.preparingOrders ?? '—'} loading={isLoading} />
          <AdminMetricCard label="Active stores" value={d?.storeActivity.activeStores ?? '—'} loading={isLoading} href="/stores" />
          <AdminMetricCard label="Fraud alerts" value={d?.fraudAlerts ?? '—'} loading={isLoading} href="/trust-safety" />
        </div>
      </AdminSection>

      {d?.alerts && d.alerts.length > 0 && (
        <AdminSection title="Active BI alerts">
          <ul className="space-y-2">
            {d.alerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
                <span>{a.title}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    a.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {a.severity}
                </span>
              </li>
            ))}
          </ul>
        </AdminSection>
      )}
    </DashboardShell>
  );
}
