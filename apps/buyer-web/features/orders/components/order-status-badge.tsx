import { Badge } from '@/design-system/primitives';
import type { BadgeProps } from '@/design-system/primitives/badge';
import type { OrderStatus } from '@/types/orders';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  /**
   * Name of the confirmed delivery partner, if one is actually attached. When
   * the order is RIDER_ASSIGNED but no real rider is confirmed yet (the provider
   * only "accepted" the order), we show an "allocating" copy rather than
   * implying a rider is already on it.
   */
  driverName?: string | null;
}

type Tone = NonNullable<BadgeProps['tone']>;

const RIDER_ALLOCATING_LABEL = 'Delivery partner being allocated…';

const STATUS_CONFIG: Record<OrderStatus, { label: string; tone: Tone }> = {
  CREATED: { label: 'Placed', tone: 'brand' },
  PAYMENT_PENDING: { label: 'Awaiting payment', tone: 'warning' },
  PAID: { label: 'Paid', tone: 'brand' },
  MERCHANT_ACCEPTED: { label: 'Accepted', tone: 'brand' },
  PREPARING: { label: 'Preparing', tone: 'brand' },
  PACKING: { label: 'Packing', tone: 'brand' },
  READY_FOR_PICKUP: { label: 'Ready', tone: 'success' },
  RIDER_ASSIGNED: { label: 'Rider assigned', tone: 'success' },
  PICKED_UP: { label: 'Picked up', tone: 'success' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', tone: 'success' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED_BY_BUYER: { label: 'Cancelled', tone: 'danger' },
  CANCELLED_BY_MERCHANT: { label: 'Cancelled by store', tone: 'danger' },
  CANCELLED_BY_ADMIN: { label: 'Cancelled', tone: 'danger' },
  PAYMENT_FAILED: { label: 'Payment failed', tone: 'danger' },
  DELIVERY_FAILED: { label: 'Delivery failed', tone: 'danger' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
};

export function OrderStatusBadge({ status, driverName }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, tone: 'neutral' as Tone };
  const label =
    status === 'RIDER_ASSIGNED' && !driverName?.trim() ? RIDER_ALLOCATING_LABEL : config.label;
  return <Badge tone={config.tone}>{label}</Badge>;
}
