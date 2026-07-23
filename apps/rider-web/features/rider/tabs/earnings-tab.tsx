'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getEarnings, getEarningsHistory, getPendingCod } from '@/lib/api';
import { inr } from '@/lib/rider-format';
import { HeroStat, Metric, Panel } from '@/design-system/primitives';

type RangeKey = 'all' | 'today' | 'week' | 'month';

function rangeToDates(key: RangeKey): { dateFrom?: string; dateTo?: string } {
  if (key === 'all') return {};
  const now = new Date();
  const from = new Date(now);
  if (key === 'today') from.setHours(0, 0, 0, 0);
  if (key === 'week') from.setDate(from.getDate() - 7);
  if (key === 'month') from.setDate(from.getDate() - 30);
  return { dateFrom: from.toISOString() };
}

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: '30 days' },
  { key: 'all', label: 'All time' },
];

export function EarningsTab() {
  const earnings = useQuery({ queryKey: ['rider', 'finance', 'earnings'], queryFn: getEarnings });
  const cod = useQuery({ queryKey: ['rider', 'finance', 'cod'], queryFn: getPendingCod });
  const [range, setRange] = useState<RangeKey>('week');
  const [page, setPage] = useState(1);
  const history = useQuery({
    queryKey: ['rider', 'finance', 'earnings', 'history', range, page],
    queryFn: () => getEarningsHistory({ page, ...rangeToDates(range) }),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-rider-border bg-rider-surface p-5">
        <HeroStat label="Today's earnings" value={inr(earnings.data?.today ?? 0)} accent />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="This week" value={inr(earnings.data?.thisWeek ?? 0)} />
        <Metric label="Pending payout" value={inr(earnings.data?.pendingPayout ?? 0)} />
        <Metric label="Total paid" value={inr(earnings.data?.totalPaid ?? 0)} />
        <Metric label="COD to deposit" value={inr(cod.data?.totalToDeposit ?? 0)} />
      </div>

      <Link
        href="/account/bank"
        className="block w-full rounded-2xl border border-rider-border bg-rider-surface p-4 text-left"
      >
        <p className="font-bold text-rider-text">Payout account</p>
        <p className="text-sm text-rider-muted">Manage bank account and UPI details.</p>
      </Link>

      <Panel title="COD deposit">
        {!cod.data || cod.data.count === 0 ? (
          <p className="text-sm text-rider-muted">No COD cash pending.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-rider-text">
              Deposit <b className="text-rider-accent">{inr(cod.data.totalToDeposit)}</b> for{' '}
              {cod.data.count} COD orders.
            </p>
            <Link
              href="/cod"
              className="grid h-12 w-full place-items-center rounded-xl bg-rider-accent font-bold text-rider-accent-foreground"
            >
              Review &amp; submit COD
            </Link>
          </div>
        )}
      </Panel>

      <Panel title="Delivery history">
        <div className="mb-3 flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => {
                setRange(r.key);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                range === r.key ? 'bg-rider-accent text-rider-accent-foreground' : 'bg-white/5 text-rider-muted'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {history.isLoading ? (
          <p className="text-sm text-rider-muted">Loading…</p>
        ) : (history.data?.items ?? []).length === 0 ? (
          <p className="text-sm text-rider-muted">No delivered orders in this range.</p>
        ) : (
          <>
            <ul className="space-y-2">
              {history.data?.items.map((d) => (
                <li key={`${d.orderNumber}-${d.deliveredAt}`} className="flex justify-between gap-3 text-sm">
                  <span>
                    {d.orderNumber}
                    <br />
                    <span className="text-xs text-rider-muted">
                      {d.paymentMethod}
                      {d.deliveredAt ? ` · ${new Date(d.deliveredAt).toLocaleDateString('en-IN')}` : ''}
                    </span>
                  </span>
                  <b className="text-rider-online">{inr(d.earning)}</b>
                </li>
              ))}
            </ul>

            {history.data && history.data.meta.totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-rider-text disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-rider-muted">
                  Page {history.data.meta.page} of {history.data.meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(history.data!.meta.totalPages, p + 1))}
                  disabled={page >= history.data.meta.totalPages}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-rider-text disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
