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

function ReturnsAndDisputes() {
  const qc = useQueryClient();
  const { data: returns = [] } = useQuery({
    queryKey: ['vendor', 'returns'],
    queryFn: async () => {
      const res = await fetch('/api/vendor/returns');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data as ReturnRow[];
    },
  });

  const { data: disputes = [] } = useQuery({
    queryKey: ['vendor', 'disputes'],
    queryFn: async () => {
      const res = await fetch('/api/vendor/disputes');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data as DisputeRow[];
    },
  });

  const resolveReturn = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const res = await fetch(`/api/vendor/returns/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor', 'returns'] }),
  });

  const resolveDispute = useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) => {
      const res = await fetch(`/api/vendor/disputes/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor', 'disputes'] }),
  });

  const openReturns = returns.filter((r) => r.status === 'REQUESTED');
  const openDisputes = disputes.filter((d) => d.status === 'OPEN');

  if (openReturns.length === 0 && openDisputes.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold text-white">Returns &amp; Disputes</h2>
      {openReturns.map((r) => (
        <div key={r.id} className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 text-sm">
          <p className="text-white">{r.vendorOrder?.orderNumber} · {r.vendorOrder?.merchantProfile?.businessName}</p>
          <p className="text-slate-400">Return requested: {r.reason}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => resolveReturn.mutate({ id: r.id, approve: true })}
              className="rounded bg-green-600 px-2 py-1 text-xs text-white"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => resolveReturn.mutate({ id: r.id, approve: false })}
              className="rounded bg-red-600 px-2 py-1 text-xs text-white"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
      {openDisputes.map((d) => (
        <div key={d.id} className="rounded-xl border border-red-800/40 bg-red-950/20 p-4 text-sm">
          <p className="text-white">{d.vendorOrder?.orderNumber} · {d.vendorOrder?.merchantProfile?.businessName}</p>
          <p className="text-slate-400">Dispute: {d.reason}</p>
          <button
            type="button"
            onClick={() => {
              const resolution = window.prompt('Resolution notes?');
              if (resolution) resolveDispute.mutate({ id: d.id, resolution });
            }}
            className="mt-2 rounded bg-violet-600 px-2 py-1 text-xs text-white"
          >
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <h1 className="mb-4 text-2xl font-bold">Orders</h1>
      <OrdersContent />
      <ReturnsAndDisputes />
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

interface ReturnRow {
  id: string;
  status: string;
  reason: string;
  vendorOrder?: { orderNumber: string; merchantProfile?: { businessName: string } };
}

interface DisputeRow {
  id: string;
  status: string;
  reason: string;
  vendorOrder?: { orderNumber: string; merchantProfile?: { businessName: string } };
}
