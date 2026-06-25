'use client';

import Link from 'next/link';
import { PIPELINE_COLUMNS } from '@/lib/order-pipeline';
import { OrderStatusBadge } from './order-status-badge';
import { OrderSlaBadge } from './order-sla-badge';
import type { MerchantOrderListItem } from '@/types/order';
import type { PipelineColumn } from '@/lib/order-pipeline';

interface Props {
  orders: MerchantOrderListItem[];
}

export function OrderPipelineBoard({ orders }: Props) {
  const byColumn = PIPELINE_COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = orders.filter(
        (o) => (o.pipelineColumn ?? inferColumn(o)) === col.id,
      );
      return acc;
    },
    {} as Record<PipelineColumn, MerchantOrderListItem[]>,
  );

  return (
    <div className="flex gap-3 overflow-x-auto p-4">
      {PIPELINE_COLUMNS.map((col) => {
        const items = byColumn[col.id] ?? [];
        return (
          <div
            key={col.id}
            className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                {col.label}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                {items.length}
              </span>
            </div>
            <div className="flex max-h-[calc(100vh-280px)] flex-col gap-2 overflow-y-auto p-2">
              {items.map((o) => (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-300 hover:shadow"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold">{o.orderNumber}</span>
                    <span className="text-xs font-medium text-slate-700">₹{o.totalAmount}</span>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {o.buyerProfile?.name ?? 'Customer'}
                    {o.buyerProfile?.phone ? ` · ${o.buyerProfile.phone}` : ''}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {o.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <OrderStatusBadge status={o.status} />
                    {o.paymentMethod === 'COD' && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">COD</span>
                    )}
                  </div>
                  {o.operations && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <OrderSlaBadge label="Age" mins={o.operations.orderAgeMins} level="green" />
                      {o.operations.sinceAcceptedMins != null && (
                        <OrderSlaBadge
                          label="Prep"
                          mins={o.operations.sinceAcceptedMins}
                          level={o.operations.prepSla}
                        />
                      )}
                    </div>
                  )}
                  {o.awaitingRider && (
                    <p className="mt-1 text-xs font-medium text-amber-600">
                      Awaiting rider · {o.riderWaitMins ?? 0}m
                    </p>
                  )}
                  {o.rider && (
                    <p className="mt-1 text-xs text-brand-600">Rider: {o.rider.name}</p>
                  )}
                </Link>
              ))}
              {items.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">No orders</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function inferColumn(o: MerchantOrderListItem): PipelineColumn {
  if (o.status === 'PAID') return 'NEW';
  if (o.status === 'MERCHANT_ACCEPTED') return 'ACCEPTED';
  if (o.status === 'PREPARING') return 'PREPARING';
  if (o.status === 'PACKING') return 'PACKING';
  if (o.status === 'READY_FOR_PICKUP') return 'READY_FOR_PICKUP';
  if (o.status === 'RIDER_ASSIGNED' || o.status === 'PICKED_UP') return 'RIDER_ASSIGNED';
  if (o.status === 'OUT_FOR_DELIVERY') return 'OUT_FOR_DELIVERY';
  if (o.status === 'DELIVERED' || o.status === 'COMPLETED') return 'DELIVERED';
  return 'CANCELLED';
}
