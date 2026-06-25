'use client';

import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { Button, Card } from '@/design-system/primitives';
import { OrderStatusBadge } from './components/order-status-badge';
import { OrderSlaBadge } from './components/order-sla-badge';
import { useOrdersQuery } from '@/hooks/use-orders';
import { useStoreStore } from '@/store/store-store';
import type { MerchantOrderListItem } from '@/types/order';

const QUEUES = [
  { key: 'incoming', label: 'Incoming', match: (o: MerchantOrderListItem) => ['PAID', 'MERCHANT_ACCEPTED'].includes(o.status) },
  { key: 'prep', label: 'Preparation', match: (o: MerchantOrderListItem) => o.status === 'PREPARING' },
  { key: 'pack', label: 'Packing', match: (o: MerchantOrderListItem) => o.status === 'PACKING' },
  { key: 'ready', label: 'Ready Queue', match: (o: MerchantOrderListItem) => o.status === 'READY_FOR_PICKUP' },
  { key: 'dispatch', label: 'Dispatch', match: (o: MerchantOrderListItem) =>
    ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status) },
] as const;

export function OrdersLivePageContent() {
  const { currentStore } = useStoreStore();
  const { data, refetch, isFetching } = useOrdersQuery(
    { storeId: currentStore?.id, today: true, limit: 200 },
    { refetchInterval: 15_000 },
  );

  const orders = data?.orders ?? [];

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kitchen / Packing — Live</h1>
          <p className="text-slate-400">{currentStore?.name ?? 'All stores'} · refreshes every 15s</p>
        </div>
        <div className="flex gap-2">
          <Link href="/orders">
            <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-800">
              Pipeline view
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching} className="border-slate-600 text-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {QUEUES.map((q) => {
          const items = orders.filter(q.match);
          return (
            <Card key={q.key} className="border-slate-700 bg-slate-800">
              <div className="border-b border-slate-700 px-4 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{q.label}</h2>
                <span className="text-2xl font-bold text-white">{items.length}</span>
              </div>
              <div className="max-h-[calc(100vh-180px)] space-y-3 overflow-y-auto p-3">
                {items.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="block rounded-xl border border-slate-600 bg-slate-900 p-4 hover:border-brand-400"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-lg font-bold">{o.orderNumber}</span>
                      <span className="text-lg font-semibold text-brand-300">₹{o.totalAmount}</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(' · ')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <OrderStatusBadge status={o.status} />
                      {o.operations?.sinceAcceptedMins != null && (
                        <OrderSlaBadge
                          label="Prep"
                          mins={o.operations.sinceAcceptedMins}
                          level={o.operations.prepSla}
                        />
                      )}
                    </div>
                    {o.awaitingRider && (
                      <p className="mt-2 text-sm font-medium text-amber-400">
                        Awaiting rider · {o.riderWaitMins}m
                      </p>
                    )}
                  </Link>
                ))}
                {items.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">Empty</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
