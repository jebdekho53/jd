'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { adminFetch } from '@/services/api/admin-client';

export function FleetAnalyticsContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'fleet'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: Record<string, unknown> }>('/api/admin/analytics/fleet');
      return res.data;
    },
  });

  return (
    <DashboardShell title="Fleet Analytics">
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Rider utilization" value={`${data.riderUtilization}%`} />
          <Stat label="Avg batch size" value={String(data.avgBatchSize)} />
          <Stat label="Route efficiency" value={`${data.routeEfficiency}%`} />
          <Stat label="Cost savings (est.)" value={`₹${data.deliveryCostSavings}`} />
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
