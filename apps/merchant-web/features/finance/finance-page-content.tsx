'use client';

import { useQuery } from '@tanstack/react-query';
import { merchantFetch } from '@/services/api/merchant-client';

function formatInr(n: number) {
  return `₹${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface RecentOrder {
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  grossAmount: number;
  netAmount: number;
  createdAt: string;
}

interface SettlementBatch {
  id: string;
  amount?: number;
  netAmount?: number;
  status: string;
  createdAt?: string;
  periodStart?: string;
  periodEnd?: string;
}

interface FinanceOverview {
  todayEarnings: number;
  wallet: {
    availableBalance: number;
    pendingBalance: number;
    totalEarned: number;
    totalPaidOut: number;
  };
  commissionBreakdown: { totalCommission: number; totalGross?: number; totalNet?: number };
  pendingSettlement: number;
  paidSettlement: number;
  recentOrders: RecentOrder[];
  settlementBatches: SettlementBatch[];
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function FinancePageContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'finance', 'overview'],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: FinanceOverview }>(
        '/api/merchant/finance/overview',
      );
      return res.data;
    },
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading finances…</p>;
  }

  const w = data?.wallet;
  const commission = data?.commissionBreakdown?.totalCommission ?? 0;
  const gross = data?.commissionBreakdown?.totalGross ?? 0;

  return (
    <div className="space-y-6">
      {/* Financial summary — the money you earned, what the platform took, what's due */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Gross sales" value={formatInr(gross)} sub="Before commission & delivery" />
        <MetricCard label="Platform commission" value={formatInr(commission)} sub="Category-based cut" />
        <MetricCard label="Pending settlement" value={formatInr(data?.pendingSettlement ?? 0)} sub="Yet to be paid to you" />
        <MetricCard label="Settled / paid out" value={formatInr(data?.paidSettlement ?? 0)} />
      </div>

      {/* Per-order financial breakdown — the detail Earnings doesn't show */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Recent order earnings</h2>
          <p className="text-xs text-slate-500">Net you keep after platform commission, per order.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Order value</th>
                <th className="px-4 py-2">Gross</th>
                <th className="px-4 py-2">Net earned</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentOrders ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No settled orders yet.
                  </td>
                </tr>
              ) : (
                (data?.recentOrders ?? []).map((o) => (
                  <tr key={o.orderId} className="border-t">
                    <td className="px-4 py-2 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-2">{formatInr(o.orderTotal)}</td>
                    <td className="px-4 py-2">{formatInr(o.grossAmount)}</td>
                    <td className="px-4 py-2 font-semibold text-emerald-700">{formatInr(o.netAmount)}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement batches — payout history */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Settlement history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Period</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.settlementBatches ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                    No settlements yet.
                  </td>
                </tr>
              ) : (
                (data?.settlementBatches ?? []).map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-2">
                      {s.periodStart
                        ? `${new Date(s.periodStart).toLocaleDateString('en-IN')} – ${s.periodEnd ? new Date(s.periodEnd).toLocaleDateString('en-IN') : ''}`
                        : s.createdAt
                          ? new Date(s.createdAt).toLocaleDateString('en-IN')
                          : '—'}
                    </td>
                    <td className="px-4 py-2 font-medium">{formatInr(s.netAmount ?? s.amount ?? 0)}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Looking for your wallet balance or to request a payout? See the <strong>Earnings</strong> page.
      </p>
    </div>
  );
}
