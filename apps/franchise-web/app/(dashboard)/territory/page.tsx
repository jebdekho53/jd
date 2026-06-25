'use client';

import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function TerritoryInner() {
  const { data } = useQuery({
    queryKey: ['franchise', 'territory'],
    queryFn: async () => {
      const res = await fetch('/api/franchise/territory');
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Territory Coverage</h1>
      <p className="mb-2 text-sm text-slate-400">Pincodes: {(data?.pincodes ?? []).join(', ') || '—'}</p>
      <div className="space-y-2">
        {(data?.territories ?? []).map((t: { id: string; city: string; state: string; exclusivityEnabled: boolean }) => (
          <div key={t.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm">
            {t.city}, {t.state} {t.exclusivityEnabled ? '(exclusive)' : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TerritoryPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <TerritoryInner />
    </QueryClientProvider>
  );
}
