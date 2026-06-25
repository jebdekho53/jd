'use client';

import { useState } from 'react';
import {
  useCreatePayoutMutation,
  useMerchantEarningsQuery,
  useMerchantPayoutsQuery,
  useMerchantSettlementsQuery,
} from '@/hooks/use-settlement';
import { Button } from '@/design-system/primitives';

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function EarningsPageContent() {
  const earnings = useMerchantEarningsQuery();
  const settlements = useMerchantSettlementsQuery();
  const payouts = useMerchantPayoutsQuery();
  const createPayout = useCreatePayoutMutation();

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');

  const data = earnings.data;
  const w = data?.wallet;

  const handlePayout = (e: React.FormEvent) => {
    e.preventDefault();
    createPayout.mutate(
      {
        amount: Number(amount),
        accountHolderName,
        accountNumber,
        ifsc,
        bankName: bankName || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setAmount('');
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Available balance" value={formatInr(w?.availableBalance ?? 0)} />
        <MetricCard label="Pending settlement" value={formatInr(w?.pendingBalance ?? 0)} />
        <MetricCard label="Total earned" value={formatInr(w?.totalEarned ?? 0)} />
        <MetricCard label="Total paid out" value={formatInr(w?.totalPaidOut ?? 0)} />
      </div>

      {data?.commissionBreakdown && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Commission breakdown</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3 text-sm">
            <div><span className="text-slate-500">Gross revenue</span><p className="font-semibold">{formatInr(data.commissionBreakdown.totalGross)}</p></div>
            <div><span className="text-slate-500">Platform commission</span><p className="font-semibold text-amber-700">{formatInr(data.commissionBreakdown.totalCommission)}</p></div>
            <div><span className="text-slate-500">Net earnings</span><p className="font-semibold text-emerald-700">{formatInr(data.commissionBreakdown.totalNet)}</p></div>
          </div>
        </section>
      )}

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Request payout</h2>
          <p className="text-sm text-slate-500">Withdraw from available balance after settlement (T+2)</p>
        </div>
        {!data?.openPayoutRequest && (
          <Button type="button" onClick={() => setShowForm((v) => !v)} disabled={(w?.availableBalance ?? 0) <= 0}>
            Request payout
          </Button>
        )}
        {data?.openPayoutRequest && (
          <p className="text-sm text-amber-700">
            Open request: {formatInr(data.openPayoutRequest.amount)} ({data.openPayoutRequest.status})
          </p>
        )}
      </section>

      {showForm && (
        <form onSubmit={handlePayout} className="grid max-w-lg gap-3 rounded-lg border bg-white p-4">
          <input type="number" placeholder="Amount (INR)" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded border px-3 py-2 text-sm" required min={1} max={w?.availableBalance} />
          <input placeholder="Account holder name" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} className="rounded border px-3 py-2 text-sm" required />
          <input placeholder="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="rounded border px-3 py-2 text-sm" required />
          <input placeholder="IFSC" value={ifsc} onChange={(e) => setIfsc(e.target.value)} className="rounded border px-3 py-2 text-sm" required />
          <input placeholder="Bank name (optional)" value={bankName} onChange={(e) => setBankName(e.target.value)} className="rounded border px-3 py-2 text-sm" />
          {createPayout.isError && <p className="text-sm text-red-600">{(createPayout.error as Error).message}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={createPayout.isPending}>Submit request</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Settlement history</h2>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Gross</th>
                <th className="px-4 py-3 text-left">Commission</th>
                <th className="px-4 py-3 text-left">Net</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {(settlements.data?.settlements ?? data?.settlementHistory ?? []).map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{s.orderNumber}</td>
                  <td className="px-4 py-3">{formatInr(s.grossAmount)}</td>
                  <td className="px-4 py-3">{formatInr('platformCommission' in s ? s.platformCommission : 0)}</td>
                  <td className="px-4 py-3">{formatInr(s.netAmount)}</td>
                  <td className="px-4 py-3 text-xs">{s.status}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!settlements.data?.settlements.length && !data?.settlementHistory.length && (
            <p className="p-8 text-center text-sm text-slate-500">No settlements yet. Earnings appear when orders are delivered.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Payout requests</h2>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Requested</th>
                <th className="px-4 py-3 text-left">Processed</th>
              </tr>
            </thead>
            <tbody>
              {(payouts.data?.payouts ?? []).map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{formatInr(p.amount)}</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3">{new Date(p.requestedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{p.processedAt ? new Date(p.processedAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payouts.data?.payouts.length && (
            <p className="p-8 text-center text-sm text-slate-500">No payout requests yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
