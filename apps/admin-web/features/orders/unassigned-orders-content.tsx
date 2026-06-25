'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  useRiderQueueQuery,
  useAvailableRidersQuery,
  useAssignRiderMutation,
  useAutoAssignMutation,
  useReassignRiderMutation,
} from '@/hooks/use-rider-queue';
import type { RiderQueueOrder } from '@/types/order';

function AssignRowActions({ order }: { order: RiderQueueOrder }) {
  const storeId = order.store?.id;
  const { data: riders } = useAvailableRidersQuery(storeId);
  const [selectedRider, setSelectedRider] = useState('');
  const assign = useAssignRiderMutation();
  const autoAssign = useAutoAssignMutation();
  const reassign = useReassignRiderMutation();

  const busy = assign.isPending || autoAssign.isPending || reassign.isPending;
  const zoneLabel = order.zones.map((z) => z.name).join(', ') || '—';

  return (
    <tr className="border-b border-border/60 hover:bg-muted/40">
      <td className="px-3 py-2.5 font-mono text-xs">{order.orderNumber}</td>
      <td className="px-3 py-2.5 text-sm">{order.store?.name ?? '—'}</td>
      <td className="px-3 py-2.5 text-sm">{order.merchant?.businessName ?? '—'}</td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">
        {new Date(order.createdAt).toLocaleString('en-IN')}
      </td>
      <td className="px-3 py-2.5 text-xs">{zoneLabel}</td>
      <td className="px-3 py-2.5 text-center text-sm font-medium">
        <span className={order.availableRiderCount === 0 ? 'text-amber-600' : 'text-emerald-600'}>
          {order.availableRiderCount}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            className="max-w-[140px] rounded border border-border bg-background px-2 py-1 text-xs"
            value={selectedRider}
            onChange={(e) => setSelectedRider(e.target.value)}
            disabled={!storeId || busy}
          >
            <option value="">Select rider</option>
            {(riders ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.distanceKm}km{r.inZone ? ' · zone' : ''})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedRider || busy}
            onClick={() => assign.mutate({ orderId: order.id, riderProfileId: selectedRider })}
            className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            Assign
          </button>
          <button
            type="button"
            disabled={busy || order.availableRiderCount === 0}
            onClick={() => autoAssign.mutate(order.id)}
            className="rounded border border-border px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            Auto Assign
          </button>
          <Link
            href={`/orders/${order.id}`}
            className="rounded border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
          >
            Open Order
          </Link>
          <button
            type="button"
            disabled={!selectedRider || busy}
            onClick={() => reassign.mutate({ orderId: order.id, riderProfileId: selectedRider })}
            className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-800 hover:bg-amber-50 disabled:opacity-50"
          >
            Reassign
          </button>
        </div>
      </td>
    </tr>
  );
}

export function UnassignedOrdersContent() {
  const { data, isLoading, isError, refetch } = useRiderQueueQuery(1);
  const orders = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Refresh
        </button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading queue…</p>}
      {isError && (
        <p className="text-sm text-red-600">Failed to load rider queue. Check your session.</p>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">No unassigned orders — all caught up.</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-border bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">Store</th>
                <th className="px-3 py-2">Merchant</th>
                <th className="px-3 py-2">Created At</th>
                <th className="px-3 py-2">Zone</th>
                <th className="px-3 py-2 text-center">Riders</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <AssignRowActions key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
