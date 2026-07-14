'use client';

import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface Settlement {
  id: string;
  periodStart: string;
  periodEnd: string;
  commissionBase: number | string;
  franchiseShare: number | string;
  gstAmount: number | string;
  tdsAmount: number | string;
  netPayable: number | string;
  status: string;
}

interface Payout {
  id: string;
  netAmount: number | string;
  status: string;
  razorpayTransferId?: string | null;
  utr?: string | null;
  failureReason?: string | null;
  createdAt: string;
  bankSnapshot?: { accountNumberLast4?: string } | null;
}

/** Prisma Decimals arrive as strings — coerce before formatting. */
const money = (v: number | string | null | undefined) => `₹${Number(v ?? 0).toFixed(2)}`;

function FinanceInner() {
  const settlements = useQuery<Settlement[]>({
    queryKey: ['franchise', 'finance'],
    queryFn: async () => (await (await fetch('/api/franchise/finance')).json()).data ?? [],
  });
  const payouts = useQuery<Payout[]>({
    queryKey: ['franchise', 'payouts'],
    queryFn: async () => (await (await fetch('/api/franchise/payouts')).json()).data ?? [],
  });

  const rows = settlements.data ?? [];
  const totalPaid = (payouts.data ?? [])
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.netAmount), 0);
  const pending = rows
    .filter((s) => s.status !== 'PAID')
    .reduce((sum, s) => sum + Number(s.netPayable), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="mt-1 text-sm text-slate-400">
          You earn a share of the platform commission on every order from your stores.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <Stat label="Paid out" value={money(totalPaid)} />
        <Stat label="Awaiting payout" value={money(pending)} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Settlements</h2>
        {rows.length === 0 && <p className="text-sm text-slate-500">No settlements yet.</p>}

        <div className="space-y-2">
          {rows.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-300">
                  {new Date(s.periodStart).toLocaleDateString()} –{' '}
                  {new Date(s.periodEnd).toLocaleDateString()}
                </span>
                <Pill status={s.status} />
              </div>

              {/* The full breakdown, so a partner can see exactly why the amount that
                  reached their bank differs from their commission share. */}
              <dl className="space-y-1.5 text-sm">
                <Line label="Platform commission on your stores" value={money(s.commissionBase)} muted />
                <Line label="Your share" value={money(s.franchiseShare)} />
                {Number(s.gstAmount) > 0 && (
                  <Line label="GST (18%)" value={`+ ${money(s.gstAmount)}`} muted />
                )}
                <Line label="TDS (5%, s.194H)" value={`− ${money(s.tdsAmount)}`} amber />
                <div className="mt-2 flex justify-between border-t border-slate-800 pt-2 text-sm font-semibold text-white">
                  <dt>{s.status === 'PAID' ? 'Paid to your bank' : 'Payable to your bank'}</dt>
                  <dd>{money(s.netPayable)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Payouts</h2>
        {(payouts.data ?? []).length === 0 && <p className="text-sm text-slate-500">No payouts yet.</p>}
        <div className="space-y-2">
          {(payouts.data ?? []).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm"
            >
              <div>
                <p className="text-slate-200">{money(p.netAmount)}</p>
                <p className="text-xs text-slate-500">
                  {new Date(p.createdAt).toLocaleDateString()}
                  {p.bankSnapshot?.accountNumberLast4 && ` · ••••${p.bankSnapshot.accountNumberLast4}`}
                  {p.utr && ` · UTR ${p.utr}`}
                </p>
                {p.status === 'FAILED' && p.failureReason && (
                  <p className="mt-1 text-xs text-red-300">{p.failureReason}</p>
                )}
              </div>
              <Pill status={p.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Line({
  label,
  value,
  muted,
  amber,
}: {
  label: string;
  value: string;
  muted?: boolean;
  amber?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className={muted ? 'text-slate-500' : 'text-slate-400'}>{label}</dt>
      <dd className={amber ? 'text-amber-300' : muted ? 'text-slate-500' : 'text-slate-200'}>{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Pill({ status }: { status: string }) {
  const tone =
    status === 'PAID' || status === 'COMPLETED'
      ? 'bg-emerald-500/15 text-emerald-300'
      : status === 'FAILED'
        ? 'bg-red-500/15 text-red-300'
        : 'bg-slate-700/40 text-slate-300';
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>;
}

export default function FinancePage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <FinanceInner />
    </QueryClientProvider>
  );
}
