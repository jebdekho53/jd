'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listOrders } from '@/lib/api';
import { EmptyState } from '@/design-system/primitives';
import { OrderCard } from '../order-card';

export function OrdersTab() {
  const orders = useQuery({ queryKey: ['rider', 'orders'], queryFn: listOrders, refetchInterval: 15_000 });

  if (orders.isLoading) return <EmptyState title="Loading orders" body="Fetching your assigned deliveries." />;
  if (orders.isError) {
    return <EmptyState title="Could not load orders" body="Check your connection and try again." />;
  }
  if ((orders.data ?? []).length === 0) {
    return (
      <EmptyState
        title="No assigned orders"
        body="Assigned deliveries will appear here as soon as dispatch sends them to you."
      />
    );
  }

  return (
    <div className="space-y-3">
      {(orders.data ?? []).map((order) => (
        <Link key={order.deliveryId} href={`/orders/${order.orderId}`} className="block">
          <OrderCard order={order} />
        </Link>
      ))}
    </div>
  );
}
