'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Package } from 'lucide-react';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import type { OrderListItem } from '@/types/orders';

interface OrderCardProps {
  order: OrderListItem;
}

export function OrderCard({ order }: OrderCardProps) {
  const itemSummary = order.items
    .map((i) => `${i.productName} × ${i.quantity}`)
    .join(', ');

  const thumbnail = order.items.find((i) => i.imageUrl)?.imageUrl ?? null;

  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const isActive = !['COMPLETED', 'CANCELLED_BY_BUYER', 'CANCELLED_BY_MERCHANT', 'CANCELLED_BY_ADMIN', 'REFUNDED', 'DELIVERY_FAILED'].includes(
    order.status,
  );

  const href = isActive ? `/orders/${order.id}/track` : `/orders/${order.id}`;

  return (
    <Link
      href={href}
      className="block rounded-2xl border border-border bg-card p-4 shadow-card transition hover:shadow-pop active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10 text-primary">
          {thumbnail ? (
            <Image src={thumbnail} alt={order.items[0]?.productName ?? 'Product'} fill className="object-cover" sizes="44px" />
          ) : (
            <Package className="h-5 w-5" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold text-jd-text-primary">{order.store.name}</p>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-jd-text-muted">{itemSummary}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-jd-text-muted">
            <span>{date}</span>
            <span aria-hidden>·</span>
            <span className="font-bold text-jd-text-primary">₹{Number(order.totalAmount).toFixed(2)}</span>
            <span aria-hidden>·</span>
            <span>{order.paymentMethod === 'COD' ? 'COD' : 'Paid online'}</span>
          </div>
          {isActive && (
            <p className="mt-2 text-xs font-semibold text-primary">
              Track order →
            </p>
          )}
        </div>
        <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-jd-text-muted" aria-hidden />
      </div>
    </Link>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex gap-3">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted/70" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted/70" />
        </div>
      </div>
    </div>
  );
}
