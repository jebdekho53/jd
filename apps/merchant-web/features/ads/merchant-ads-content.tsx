'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

async function fetchAds(path: string) {
  const res = await fetch(`/api/merchant/ads/${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function MerchantAdsContent() {
  const { data: campaigns } = useQuery({ queryKey: ['merchant', 'ads', 'campaigns'], queryFn: () => fetchAds('campaigns') });
  const { data: analytics } = useQuery({ queryKey: ['merchant', 'ads', 'analytics'], queryFn: () => fetchAds('analytics') });

  return (
    <DashboardLayout title="Retail Media & Ads">
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Impressions" value={analytics?.impressions ?? 0} />
        <Stat label="CTR" value={`${analytics?.ctr ?? 0}%`} />
        <Stat label="ROAS" value={String(analytics?.roas ?? 0)} />
        <Stat label="Spend" value={`₹${analytics?.spend ?? 0}`} />
      </div>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Campaigns</h2>
        {(campaigns ?? []).map((c: { id: string; name: string; status: string; budget: number }) => (
          <div key={c.id} className="flex justify-between border-b py-2 text-sm last:border-0">
            <span>{c.name}</span>
            <span>{c.status} · ₹{Number(c.budget)}</span>
          </div>
        ))}
        {(campaigns ?? []).length === 0 && <p className="text-sm text-slate-500">No campaigns yet.</p>}
      </section>
    </DashboardLayout>
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
