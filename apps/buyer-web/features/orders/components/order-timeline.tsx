'use client';

import { Check } from 'lucide-react';
import { Text } from '@/design-system/primitives';
import type { OrderStatus, OrderTimelineEntry } from '@/types/orders';

const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  PAYMENT_PENDING: 'Order placed',
  PAID: 'Payment confirmed',
  MERCHANT_ACCEPTED: 'Store accepted',
  PREPARING: 'Preparing your order',
  READY_FOR_PICKUP: 'Ready for pickup',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  COMPLETED: 'Order completed',
  CANCELLED_BY_BUYER: 'Cancelled by you',
  CANCELLED_BY_MERCHANT: 'Cancelled by store',
  CANCELLED_BY_ADMIN: 'Cancelled',
  PAYMENT_FAILED: 'Payment failed',
  REFUNDED: 'Refunded',
};

interface OrderTimelineProps {
  history: OrderTimelineEntry[];
}

export function OrderTimeline({ history }: OrderTimelineProps) {
  return (
    <div className="relative space-y-0">
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;
        const label = STATUS_LABELS[entry.status] ?? entry.status;
        const time = new Date(entry.createdAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const date = new Date(entry.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        });

        return (
          <div key={`${entry.status}-${index}`} className="relative flex gap-4">
            {/* Vertical connector */}
            {!isLast && (
              <div className="absolute left-4 top-8 h-full w-px bg-neutral-200" />
            )}

            {/* Icon */}
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className={`pb-5 ${isLast ? '' : ''}`}>
              <Text variant="label">{label}</Text>
              <Text variant="caption">
                {date} at {time}
              </Text>
              {entry.note && (
                <Text variant="caption" className="mt-0.5 text-neutral-500 italic">
                  {entry.note}
                </Text>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
