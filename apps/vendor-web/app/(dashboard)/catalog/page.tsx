'use client';

import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function CatalogContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor', 'catalog'],
    queryFn: async () => {
      const res = await fetch('/api/vendor/catalog');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data;
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading catalog…</p>;

  return (
    <div className="space-y-4">
      {(data ?? []).map((cat: CatalogRow) => (
        <div key={cat.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-medium text-white">{cat.name}</h2>
          <div className="mt-2 space-y-1">
            {(cat.products ?? []).map((p: ProductRow) => (
              <div key={p.id} className="flex justify-between text-sm text-slate-300">
                <span>{p.name} ({p.sku})</span>
                <span>₹{Number(p.basePrice)} · Stock {p.inventory?.availableQty ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CatalogPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <h1 className="mb-4 text-2xl font-bold">Catalog</h1>
      <CatalogContent />
    </QueryClientProvider>
  );
}

interface CatalogRow { id: string; name: string; products?: ProductRow[] }
interface ProductRow { id: string; name: string; sku: string; basePrice: number; inventory?: { availableQty: number } }
