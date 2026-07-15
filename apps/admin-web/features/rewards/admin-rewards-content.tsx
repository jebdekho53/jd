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

type ReferralStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'FRAUD_FLAGGED';

interface ReferralRow {
  id: string;
  status: ReferralStatus;
  referrerName: string;
  referrerCode: string;
  referredName: string;
  referrerReward: number;
  referredReward: number;
  createdAt: string;
  completedAt: string | null;
}

interface ReferralList {
  total: number;
  counts: Record<ReferralStatus, number>;
  referrals: ReferralRow[];
}

async function fetchReferrals(status: string) {
  const q = status === 'ALL' ? '' : `?status=${status}`;
  const res = await adminFetch<{ success: boolean; data: ReferralList }>(
    `/api/admin/rewards/referrals${q}`,
  );
  return res.data;
}

const STATUS_STYLE: Record<ReferralStatus, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FRAUD_FLAGGED: 'bg-red-100 text-red-700',
  REJECTED: 'bg-slate-200 text-slate-600',
};

export function AdminRewardsContent() {
  const [pointsPer100, setPointsPer100] = useState(1);
  const { data: analytics, refetch } = useQuery({
    queryKey: ['rewards-analytics'],
    queryFn: fetchAnalytics,
  });
  const { data: config } = useQuery({ queryKey: ['rewards-config'], queryFn: fetchConfig });
  const [refStatus, setRefStatus] = useState<'ALL' | ReferralStatus>('ALL');
  const { data: referralList } = useQuery({
    queryKey: ['rewards-referrals', refStatus],
    queryFn: () => fetchReferrals(refStatus),
  });

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

        {/* Full referral list — who referred whom, incl. pending & fraud-flagged. */}
        <div className="rounded-xl border bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Referrals</h2>
            <div className="flex flex-wrap gap-1.5">
              {(['ALL', 'PENDING', 'COMPLETED', 'FRAUD_FLAGGED', 'REJECTED'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRefStatus(s)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    refStatus === s ? 'bg-admin-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {s === 'ALL' ? 'All' : s === 'FRAUD_FLAGGED' ? 'Fraud' : s.charAt(0) + s.slice(1).toLowerCase()}
                  {referralList && s !== 'ALL' ? ` (${referralList.counts[s]})` : ''}
                </button>
              ))}
            </div>
          </div>

          {referralList && referralList.referrals.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No referrals in this view.</p>
          )}

          {referralList && referralList.referrals.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs text-slate-500">
                  <tr className="border-b">
                    <th className="pb-2 pr-3 font-medium">Referrer</th>
                    <th className="pb-2 pr-3 font-medium">Referred</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 pr-3 text-right font-medium">Referrer ₹</th>
                    <th className="pb-2 pr-3 text-right font-medium">Referred ₹</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referralList.referrals.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3">
                        {r.referrerName}
                        <span className="ml-1 text-xs text-slate-400">{r.referrerCode}</span>
                      </td>
                      <td className="py-2 pr-3">{r.referredName}</td>
                      <td className="py-2 pr-3">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                          {r.status === 'FRAUD_FLAGGED' ? 'FRAUD' : r.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right">{r.referrerReward ? inr(r.referrerReward) : '—'}</td>
                      <td className="py-2 pr-3 text-right">{r.referredReward ? inr(r.referredReward) : '—'}</td>
                      <td className="py-2 text-slate-500">
                        {new Date(r.completedAt ?? r.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
