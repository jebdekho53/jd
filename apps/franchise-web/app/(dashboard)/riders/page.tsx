'use client';

import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function RidersInner() {
  const { data } = useQuery({
    queryKey: ['franchise', 'dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/franchise/dashboard');
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Riders</h1>
      <p className="text-2xl font-bold text-violet-400">{data?.riderCount ?? 0}</p>
      <p className="text-sm text-slate-500">Active riders in network</p>
    </div>
  );
}

export default function RidersPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <RidersInner />
    </QueryClientProvider>
  );
}
