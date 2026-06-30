'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { Button, Card } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import { BackButton } from '@/components/navigation/back-button';
import {
  fetchKitchenQueue,
  updateKitchenOrderStatus,
  type KitchenOrder,
} from '@/services/restaurant/menu-api';

const COLUMNS = [
  { key: 'new' as const, label: 'New', next: 'PREPARING', action: 'Start preparing' },
  { key: 'preparing' as const, label: 'Preparing', next: 'READY', action: 'Mark ready' },
  { key: 'ready' as const, label: 'Ready', next: 'COMPLETED', action: 'Complete' },
];

function OrderCard({
  order,
  action,
  loading,
  onAdvance,
}: {
  order: KitchenOrder;
  action?: string;
  loading: boolean;
  onAdvance?: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-lg font-bold">{order.orderNumber}</span>
        <span className="text-lg font-semibold text-brand-300">₹{order.totalAmount}</span>
      </div>
      <ul className="mb-3 space-y-1 text-sm text-slate-300">
        {order.foodItems.map((item, i) => (
          <li key={i}>
            {item.quantity}× {item.itemName}
            {item.specialInstructions && (
              <span className="block text-xs text-amber-300">Note: {item.specialInstructions}</span>
            )}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {action && onAdvance && (
          <Button size="sm" loading={loading} onClick={onAdvance}>
            {action}
          </Button>
        )}
      </div>
    </div>
  );
}

export function KitchenDisplayContent({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['merchant', 'kitchen', storeId],
    queryFn: () => fetchKitchenQueue(storeId),
    refetchInterval: 10_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateKitchenOrderStatus(storeId, orderId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['merchant', 'kitchen', storeId] });
      qc.invalidateQueries({ queryKey: ['merchant', 'restaurant-dashboard', storeId] });
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  return (
    <div className="min-h-[calc(100vh-8rem)] rounded-2xl bg-slate-900 p-4 text-white lg:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kitchen Display</h1>
          <p className="text-slate-400">New → Preparing → Ready · auto-refreshes every 10s</p>
        </div>
        <div className="flex items-center gap-3">
          <BackButton fallbackHref="/orders" className="border-slate-600 text-white hover:bg-slate-800" />
          <div className="rounded-xl bg-slate-800 px-4 py-2 text-center">
            <p className="text-xs uppercase text-slate-400">Completed today</p>
            <p className="text-2xl font-bold">{data?.completed ?? 0}</p>
          </div>
          <Link href={`/stores/${storeId}/restaurant-dashboard`}>
            <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-800">
              Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching} className="border-slate-600 text-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const orders = data?.[col.key] ?? [];
          return (
            <Card key={col.key} className="border-slate-700 bg-slate-800">
              <div className="border-b border-slate-700 px-4 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">{col.label}</h2>
                <span className="text-2xl font-bold text-white">{orders.length}</span>
              </div>
              <div className="max-h-[calc(100vh-220px)] space-y-3 overflow-y-auto p-3">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    action={col.action}
                    loading={statusMutation.isPending}
                    onAdvance={() => statusMutation.mutate({ orderId: order.id, status: col.next })}
                  />
                ))}
                {!orders.length && (
                  <p className="py-8 text-center text-sm text-slate-500">No orders in this queue.</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
