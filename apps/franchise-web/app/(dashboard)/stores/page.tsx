'use client';

import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface FranchiseStoreLink {
  id: string;
  conflictReason?: string | null;
  store: { id: string; name: string; pincode?: string | null };
}

interface StoresResponse {
  storeCount: number;
  links: {
    active: FranchiseStoreLink[];
    pendingReview: FranchiseStoreLink[];
    rejected: FranchiseStoreLink[];
  };
}

function StoresInner() {
  const { data, isLoading } = useQuery({
    queryKey: ['franchise', 'stores'],
    queryFn: async (): Promise<StoresResponse> => {
      const res = await fetch('/api/franchise/stores');
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Franchise Stores</h1>
        <p className="mt-1 text-sm text-slate-400">{data?.storeCount ?? 0} linked stores</p>
      </div>

      <StoreGroup label="Active" links={data?.links.active ?? []} />
      <StoreGroup label="Pending Review" links={data?.links.pendingReview ?? []} />
      <StoreGroup label="Rejected" links={data?.links.rejected ?? []} />
    </div>
  );
}

function StoreGroup({ label, links }: { label: string; links: FranchiseStoreLink[] }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">
        {label} <span className="text-slate-500">({links.length})</span>
      </h2>
      <div className="space-y-2">
        {links.map((link) => (
          <div key={link.id} className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-white">{link.store.name}</span>
              <span className="text-xs text-slate-400">{link.store.pincode}</span>
            </div>
            {link.conflictReason && (
              <p className="mt-2 text-xs text-amber-300">{link.conflictReason}</p>
            )}
          </div>
        ))}
        {links.length === 0 && <p className="text-sm text-slate-600">None.</p>}
      </div>
    </section>
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
