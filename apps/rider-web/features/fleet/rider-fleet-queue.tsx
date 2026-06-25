'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchFleet(path: string) {
  const res = await fetch(`/api/rider/fleet/${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function RiderFleetQueue() {
  const { data: queue } = useQuery({ queryKey: ['rider', 'fleet', 'queue'], queryFn: () => fetchFleet('queue') });
  const { data: route } = useQuery({ queryKey: ['rider', 'fleet', 'route'], queryFn: () => fetchFleet('route') });

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 font-semibold">Fleet Queue</h2>
        {queue?.currentBatch ? (
          <>
            <p className="text-sm text-slate-500">Batch {queue.currentBatch.status} · {queue.currentBatch.totalOrders} orders</p>
            <ul className="mt-2 space-y-1 text-sm">
              {queue.currentBatch.items?.map((i: { sequence: number; order: { orderNumber: string } }) => (
                <li key={i.sequence}>#{i.sequence} — {i.order.orderNumber}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-slate-500">No active batch</p>
        )}
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 font-semibold">Route View</h2>
        {route ? (
          <p className="text-sm">
            {route.distanceKm} km · ~{route.estimatedMinutes} min
            {route.optimized ? ' · optimized' : ''}
          </p>
        ) : (
          <p className="text-sm text-slate-500">Route not optimized yet</p>
        )}
      </section>
    </div>
  );
}
