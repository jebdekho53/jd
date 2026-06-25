'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export function AdminAdsContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ads'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ads/overview');
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <DashboardShell title="Ads Control Center">
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Ad revenue" value={`₹${data.metrics?.revenue ?? 0}`} />
            <Stat label="ROAS" value={String(data.metrics?.roas ?? 0)} />
            <Stat label="CTR" value={`${data.metrics?.ctr ?? 0}%`} />
            <Stat label="Advertisers" value={data.metrics?.advertisers ?? 0} />
          </div>
          <section className="rounded-xl border bg-white p-4">
            <h2 className="mb-2 font-semibold">Active campaigns</h2>
            {(data.campaigns ?? []).map((c: { id: string; name: string; advertiser: { businessName: string } }) => (
              <p key={c.id} className="text-sm">{c.name} — {c.advertiser.businessName}</p>
            ))}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
