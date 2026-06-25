'use client';

import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function DashboardInner() {
  const { data, isLoading } = useQuery({
    queryKey: ['franchise', 'dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/franchise/dashboard');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data;
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{data?.businessName ?? 'Franchise Dashboard'}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="GMV (30d)" value={`₹${(data?.gmv30d ?? 0).toLocaleString()}`} />
        <Stat label="Orders" value={String(data?.orders30d ?? 0)} />
        <Stat label="Revenue Share" value={`₹${(data?.revenueShare ?? 0).toLocaleString()}`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <DashboardInner />
    </QueryClientProvider>
  );
}
