'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Text } from '@/design-system/primitives';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import type { OrderListItem } from '@/types/orders';

interface OrderCardProps {
  order: OrderListItem;
}

export function OrderCard({ order }: OrderCardProps) {
  const itemSummary = order.items
    .map((i) => `${i.productName} × ${i.quantity}`)
    .join(', ');

  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <Text variant="label" className="truncate">
              {order.store.name}
            </Text>
            <OrderStatusBadge status={order.status} />
          </div>
          <Text variant="caption" className="line-clamp-1">
            {itemSummary}
          </Text>
          <div className="flex items-center gap-3 pt-1">
            <Text variant="caption">{date}</Text>
            <span className="text-neutral-300">·</span>
            <Text variant="label" className="text-sm">
              ₹{Number(order.totalAmount).toFixed(2)}
            </Text>
            <span className="text-neutral-300">·</span>
            <Text variant="caption">{order.paymentMethod === 'COD' ? 'COD' : 'Online'}</Text>
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-neutral-400" />
      </div>
    </Link>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}
