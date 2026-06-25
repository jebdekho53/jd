'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { adminFetch } from '@/services/api/admin-client';

async function fetchFranchiseAnalytics() {
  const res = await adminFetch<{ success: boolean; data: FranchiseAnalytics }>('/api/admin/analytics/franchise');
  return res.data;
}

export function FranchiseAnalyticsContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'franchise'],
    queryFn: fetchFranchiseAnalytics,
  });

  return (
    <DashboardShell title="Franchise Analytics">
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Active franchises" value={String(data.activeFranchises)} />
            <Metric label="Platform GMV (30d)" value={`₹${data.platformGmv30d.toLocaleString()}`} />
            <Metric label="Franchise GMV" value={`₹${data.franchiseGmvTotal.toLocaleString()}`} />
            <Metric label="Territory utilization" value={`${data.territoryUtilization}%`} />
          </div>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 font-semibold">City GMV & readiness</h2>
            <div className="space-y-1 text-sm">
              {data.cityGmv.map((c) => (
                <div key={`${c.city}-${c.state}`} className="flex justify-between">
                  <span>{c.city}, {c.state}</span>
                  <span>₹{c.gmv.toLocaleString()} · {c.launchStatus} · {Math.round(c.readinessScore)}</span>
                </div>
              ))}
              {data.cityGmv.length === 0 && <p className="text-slate-500">No city launch data.</p>}
            </div>
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 font-semibold">Expansion pipeline</h2>
            <div className="flex flex-wrap gap-3 text-sm">
              {data.expansionPipeline.map((p) => (
                <span key={p.launchStatus} className="rounded-lg bg-slate-100 px-3 py-1">
                  {p.launchStatus}: {p._count.id}
                </span>
              ))}
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

interface FranchiseAnalytics {
  activeFranchises: number;
  platformGmv30d: number;
  franchiseGmvTotal: number;
  franchiseShareTotal: number;
  ordersDelivered30d: number;
  cityGmv: Array<{ city: string; state: string; gmv: number; readinessScore: number; launchStatus: string }>;
  expansionPipeline: Array<{ launchStatus: string; _count: { id: number } }>;
  territoryUtilization: number;
}
