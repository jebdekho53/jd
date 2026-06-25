'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { adminFetch } from '@/services/api/admin-client';

function inr(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

async function fetchConfig() {
  const res = await adminFetch<{ success: boolean; data: unknown }>('/api/admin/rewards/config');
  return res.data;
}

async function fetchAnalytics() {
  const res = await adminFetch<{ success: boolean; data: {
    walletLiability: number;
    rewardPointsLiability: number;
    completedReferrals: number;
    repeatPurchaseRate: number;
    topLoyalCustomers: Array<{ name: string; tier: string; lifetimePoints: number }>;
  } }>('/api/admin/rewards/analytics');
  return res.data;
}

export function AdminRewardsContent() {
  const [pointsPer100, setPointsPer100] = useState(1);
  const { data: analytics, refetch } = useQuery({
    queryKey: ['rewards-analytics'],
    queryFn: fetchAnalytics,
  });
  const { data: config } = useQuery({ queryKey: ['rewards-config'], queryFn: fetchConfig });

  const savePointsRule = async () => {
    await adminFetch('/api/admin/rewards/config/points_per_100_inr', {
      method: 'PATCH',
      body: JSON.stringify({ value: { value: pointsPer100 } }),
    });
    refetch();
  };

  return (
    <DashboardShell title="Rewards & Wallet">
      <div className="space-y-6">
        {analytics && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Wallet liability" value={inr(analytics.walletLiability)} />
            <Stat label="Points liability" value={String(analytics.rewardPointsLiability)} />
            <Stat label="Referrals completed" value={String(analytics.completedReferrals)} />
            <Stat label="Repeat purchase %" value={`${analytics.repeatPurchaseRate}%`} />
          </div>
        )}

        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Point earning rule</h2>
          <p className="mt-1 text-sm text-slate-500">Points earned per ₹100 spent (admin configurable)</p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={pointsPer100}
              onChange={(e) => setPointsPer100(Number(e.target.value))}
              className="w-24 rounded border px-2 py-1"
            />
            <button type="button" onClick={savePointsRule} className="rounded-lg bg-admin-600 px-3 py-1.5 text-sm text-white">
              Save
            </button>
          </div>
          {config != null && (
            <pre className="mt-4 overflow-auto rounded bg-slate-50 p-3 text-xs">{JSON.stringify(config, null, 2)}</pre>
          )}
        </div>

        {analytics?.topLoyalCustomers && (
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-3 font-semibold">Top loyal customers</h2>
            <ul className="space-y-2 text-sm">
              {analytics.topLoyalCustomers.map((c, i) => (
                <li key={i} className="flex justify-between">
                  <span>{c.name} <span className="text-slate-400">({c.tier})</span></span>
                  <span>{c.lifetimePoints} pts</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
