'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { adminFetch } from '@/services/api/admin-client';

interface FraudReviewRow {
  id: string;
  reviewType: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  wallet: {
    id: string;
    referralCode: string | null;
    balance: number;
    buyerProfile?: { id: string; name: string } | null;
  };
}

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
  const qc = useQueryClient();
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

  const { data: fraudReviews = [] } = useQuery({
    queryKey: ['rewards-fraud-reviews'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: FraudReviewRow[] }>(
        '/api/admin/rewards/fraud-reviews',
      );
      return res.data;
    },
  });

  const resolveFraud = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) =>
      adminFetch(`/api/admin/rewards/fraud-reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ approve }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rewards-fraud-reviews'] }),
  });

  const [adjustWalletId, setAdjustWalletId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  const adjustWallet = useMutation({
    mutationFn: async ({ action, walletId, amount, reason }: { action: 'credit' | 'debit' | 'points'; walletId: string; amount: number; reason: string }) => {
      const body = action === 'points' ? { points: amount, reason } : { amount, reason };
      const res = await fetch(`/api/admin/rewards/wallets/${walletId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data;
    },
    onSuccess: (_data, vars) => {
      setAdjustSuccess(`${vars.action === 'credit' ? 'Credited' : vars.action === 'debit' ? 'Debited' : 'Adjusted points for'} wallet ${vars.walletId}`);
      setAdjustError(null);
      setAdjustAmount('');
      setAdjustReason('');
      refetch();
    },
    onError: (err: Error) => {
      setAdjustError(err.message);
      setAdjustSuccess(null);
    },
  });

  function submitAdjust(action: 'credit' | 'debit' | 'points') {
    setAdjustError(null);
    setAdjustSuccess(null);
    if (!adjustWalletId || !adjustAmount || !adjustReason) {
      setAdjustError('Wallet ID, amount, and reason are required');
      return;
    }
    adjustWallet.mutate({ action, walletId: adjustWalletId, amount: Number(adjustAmount), reason: adjustReason });
  }

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

        {/* Pending fraud reviews on wallets — flagged by automated rules, need an admin decision. */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold">Wallet fraud review queue</h2>
          {fraudReviews.length === 0 && (
            <p className="text-sm text-slate-400">Nothing pending review.</p>
          )}
          <div className="space-y-2">
            {fraudReviews.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-sm">
                <div>
                  <p className="font-medium">
                    {r.wallet.buyerProfile?.name ?? 'Unknown buyer'}{' '}
                    <span className="text-xs text-slate-400">wallet {r.wallet.id}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.reviewType} · balance {inr(r.wallet.balance)} · flagged {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustWalletId(r.wallet.id)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
                  >
                    Adjust wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveFraud.mutate({ id: r.id, approve: true })}
                    className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveFraud.mutate({ id: r.id, approve: false })}
                    className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual wallet adjustment — for support-ticket refunds, goodwill credits, or clawing back a fraud-confirmed balance. */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold">Manual wallet adjustment</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              placeholder="Wallet ID"
              value={adjustWalletId}
              onChange={(e) => setAdjustWalletId(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              min={0}
              placeholder="Amount / points"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            />
            <input
              placeholder="Reason (required, shown to buyer)"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            />
          </div>
          {adjustError && <p className="mt-2 text-sm text-red-600">{adjustError}</p>}
          {adjustSuccess && <p className="mt-2 text-sm text-emerald-600">{adjustSuccess}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => submitAdjust('credit')}
              disabled={adjustWallet.isPending}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Credit wallet
            </button>
            <button
              type="button"
              onClick={() => submitAdjust('debit')}
              disabled={adjustWallet.isPending}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Debit wallet
            </button>
            <button
              type="button"
              onClick={() => submitAdjust('points')}
              disabled={adjustWallet.isPending}
              className="rounded-lg bg-admin-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Adjust points
            </button>
          </div>
        </div>

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
