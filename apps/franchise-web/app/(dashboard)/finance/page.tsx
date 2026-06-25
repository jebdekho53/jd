'use client';

import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function FinanceInner() {
  const { data } = useQuery({
    queryKey: ['franchise', 'finance'],
    queryFn: async () => {
      const res = await fetch('/api/franchise/finance');
      const json = await res.json();
      return json.data ?? [];
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Settlements</h1>
      <div className="space-y-2">
        {(data ?? []).map((s: { id: string; franchiseShare: number; status: string; periodEnd: string }) => (
          <div key={s.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm flex justify-between">
            <span>{new Date(s.periodEnd).toLocaleDateString()}</span>
            <span>₹{Number(s.franchiseShare)} · {s.status}</span>
          </div>
        ))}
        {(data ?? []).length === 0 && <p className="text-slate-500">No settlements yet.</p>}
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <FinanceInner />
    </QueryClientProvider>
  );
}
