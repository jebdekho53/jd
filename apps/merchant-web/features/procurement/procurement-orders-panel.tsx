'use client';

import { useState } from 'react';
import { Badge, useToast } from '@/design-system/primitives';
import { useCreateDisputeMutation, useCreateReturnMutation, useProcurementOrdersQuery } from '@/hooks/use-procurement';
import type { VendorOrder, VendorOrderStatus } from '@/types/procurement';

const STATUS_TONE: Record<VendorOrderStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  RETURNED: 'danger',
};

export function ProcurementOrdersPanel({ storeId }: { storeId: string }) {
  const { data: orders = [], isLoading } = useProcurementOrdersQuery(storeId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const createReturn = useCreateReturnMutation(storeId);
  const createDispute = useCreateDisputeMutation(storeId);
  const { toast } = useToast();

  function requestReturn(orderId: string) {
    const reason = window.prompt('Reason for return?');
    if (!reason) return;
    createReturn.mutate(
      { orderId, reason },
      {
        onSuccess: () => toast('Return requested', 'success'),
        onError: (err: unknown) => toast((err as Error).message ?? 'Could not request return', 'error'),
      },
    );
  }

  function raiseDispute(orderId: string) {
    const reason = window.prompt('Describe the issue with this order?');
    if (!reason) return;
    createDispute.mutate(
      { orderId, reason },
      {
        onSuccess: () => toast('Dispute raised', 'success'),
        onError: (err: unknown) => toast((err as Error).message ?? 'Could not raise dispute', 'error'),
      },
    );
  }

  if (isLoading) return <p className="text-sm text-slate-500">Loading orders...</p>;
  if (orders.length === 0) return <p className="text-sm text-slate-500">No procurement orders yet.</p>;

  return (
    <div className="space-y-2">
      {orders.map((order: VendorOrder) => {
        const expanded = expandedId === order.id;
        return (
          <div key={order.id} className="rounded-xl border bg-white p-4 text-sm">
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : order.id)}
              className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
            >
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-xs text-slate-500">
                  {order.vendor?.businessName} · {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">₹{order.totalAmount.toLocaleString()}</span>
                <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
              </div>
            </button>

            {expanded && (
              <div className="mt-3 space-y-3 border-t pt-3">
                <div className="space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-slate-600">
                      <span>{item.productName} × {item.quantity}</span>
                      <span>₹{item.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {order.shipment && (
                  <p className="text-xs text-slate-500">
                    Shipment: {order.shipment.status}
                    {order.shipment.carrier && ` · ${order.shipment.carrier}`}
                    {order.shipment.trackingNumber && ` · ${order.shipment.trackingNumber}`}
                  </p>
                )}
                {order.invoice && (
                  <p className="text-xs text-slate-500">
                    Invoice: {order.invoice.status} · ₹{order.invoice.totalAmount.toLocaleString()}
                    {order.invoice.dueDate && ` · due ${new Date(order.invoice.dueDate).toLocaleDateString()}`}
                  </p>
                )}
                {order.notes && <p className="text-xs text-slate-500">Notes: {order.notes}</p>}
                {order.creditUsed > 0 && (
                  <p className="text-xs text-slate-500">Credit used: ₹{order.creditUsed.toLocaleString()}</p>
                )}

                {(order.returns ?? []).map((r) => (
                  <p key={r.id} className="text-xs text-amber-700">
                    Return {r.status.toLowerCase()}: {r.reason}
                  </p>
                ))}
                {(order.disputes ?? []).map((d) => (
                  <p key={d.id} className="text-xs text-amber-700">
                    Dispute {d.status.toLowerCase()}: {d.reason}
                    {d.resolution && ` — ${d.resolution}`}
                  </p>
                ))}

                {order.status === 'DELIVERED' && (
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => requestReturn(order.id)}
                      className="text-xs font-medium text-slate-600 hover:underline"
                    >
                      Request return
                    </button>
                    <button
                      type="button"
                      onClick={() => raiseDispute(order.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Raise dispute
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
