'use client';

import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function StoresInner() {
  const { data } = useQuery({
    queryKey: ['franchise', 'stores'],
    queryFn: async () => {
      const res = await fetch('/api/franchise/stores');
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Franchise Stores</h1>
      <p className="text-sm text-slate-400">{data?.storeCount ?? 0} linked stores</p>
    </div>
  );
}

export default function StoresPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <StoresInner />
    </QueryClientProvider>
  );
}
