'use client';

import { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-300',
  PROCESSING: 'bg-blue-500/15 text-blue-300',
  PAID: 'bg-emerald-500/15 text-emerald-300',
  FAILED: 'bg-red-500/15 text-red-300',
};

function SettlementsContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor', 'settlements'],
    queryFn: async () => {
      const res = await fetch('/api/vendor/settlements');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data as SettlementRow[];
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading settlements…</p>;

  const settlements = data ?? [];
  if (settlements.length === 0) {
    return <p className="text-sm text-slate-500">No settlements yet. Payouts are generated on a fixed cycle.</p>;
  }

  return (
    <div className="space-y-2">
      {settlements.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm">
          <div>
            <p className="text-white">
              {new Date(s.periodStart).toLocaleDateString()} – {new Date(s.periodEnd).toLocaleDateString()}
            </p>
            {s.paidAt && (
              <p className="text-xs text-slate-500">Paid {new Date(s.paidAt).toLocaleDateString()}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-white">₹{Number(s.amount).toLocaleString()}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status] ?? 'bg-slate-700 text-slate-300'}`}>
              {s.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SettlementsPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <h1 className="mb-4 text-2xl font-bold">Settlements</h1>
      <SettlementsContent />
    </QueryClientProvider>
  );
}

interface SettlementRow {
  id: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  status: string;
  paidAt: string | null;
}
