'use client';

import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function OrdersContent() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['vendor', 'orders'],
    queryFn: async () => {
      const res = await fetch('/api/vendor/orders');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data;
    },
  });

  const ship = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vendor/orders/${id}/ship`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier: 'BlueDart' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor', 'orders'] }),
  });

  const deliver = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vendor/orders/${id}/deliver`, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor', 'orders'] }),
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading orders…</p>;

  return (
    <div className="space-y-2">
      {(data ?? []).map((o: OrderRow) => (
        <div key={o.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-medium text-white">{o.orderNumber}</span>
            <span className="text-slate-400">{o.status}</span>
          </div>
          <p className="text-slate-500">₹{Number(o.totalAmount)} · {o.items?.length ?? 0} items</p>
          <div className="mt-2 flex gap-2">
            {o.status === 'PENDING' || o.status === 'CONFIRMED' ? (
              <button
                type="button"
                onClick={() => ship.mutate(o.id)}
                className="rounded bg-violet-600 px-2 py-1 text-xs text-white"
              >
                Ship
              </button>
            ) : null}
            {o.status === 'SHIPPED' ? (
              <button
                type="button"
                onClick={() => deliver.mutate(o.id)}
                className="rounded bg-green-600 px-2 py-1 text-xs text-white"
              >
                Mark delivered
              </button>
            ) : null}
          </div>
        </div>
      ))}
      {(data ?? []).length === 0 && <p className="text-slate-500">No orders yet.</p>}
    </div>
  );
}

export default function OrdersPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <h1 className="mb-4 text-2xl font-bold">Orders</h1>
      <OrdersContent />
    </QueryClientProvider>
  );
}

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items?: unknown[];
}
