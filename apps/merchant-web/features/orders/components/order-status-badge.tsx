import { Badge } from '@/design-system/primitives';
import type { BadgeProps } from '@/design-system/primitives';
import type { OrderStatus } from '@/types/order';

const STATUS_MAP: Record<OrderStatus, { tone: BadgeProps['tone']; label: string }> = {
  PAYMENT_PENDING: { tone: 'neutral', label: 'Payment Pending' },
  PAID: { tone: 'info', label: 'Paid — Awaiting Confirm' },
  MERCHANT_ACCEPTED: { tone: 'brand', label: 'Accepted' },
  PREPARING: { tone: 'warning', label: 'Preparing' },
  PACKING: { tone: 'warning', label: 'Packing' },
  READY_FOR_PICKUP: { tone: 'success', label: 'Ready for Pickup' },
  RIDER_ASSIGNED: { tone: 'info', label: 'Rider Assigned' },
  PICKED_UP: { tone: 'info', label: 'Picked Up' },
  OUT_FOR_DELIVERY: { tone: 'success', label: 'Out for Delivery' },
  DELIVERED: { tone: 'success', label: 'Delivered' },
  COMPLETED: { tone: 'success', label: 'Completed' },
  CANCELLED_BY_BUYER: { tone: 'danger', label: 'Cancelled by Buyer' },
  CANCELLED_BY_MERCHANT: { tone: 'danger', label: 'Cancelled by Merchant' },
  CANCELLED_BY_ADMIN: { tone: 'danger', label: 'Cancelled by Admin' },
  PAYMENT_FAILED: { tone: 'danger', label: 'Payment Failed' },
  REFUNDED: { tone: 'neutral', label: 'Refunded' },
  EXPIRED: { tone: 'neutral', label: 'Expired' },
};

const RIDER_ALLOCATING_LABEL = 'Delivery partner being allocated…';

export function OrderStatusBadge({
  status,
  driverName,
}: {
  status: OrderStatus;
  /** Confirmed delivery-partner name; when absent on RIDER_ASSIGNED we show an allocating copy. */
  driverName?: string | null;
}) {
  const { tone, label } = STATUS_MAP[status] ?? { tone: 'neutral', label: status };
  const displayLabel =
    status === 'RIDER_ASSIGNED' && !driverName?.trim() ? RIDER_ALLOCATING_LABEL : label;
  return <Badge tone={tone} dot>{displayLabel}</Badge>;
}
