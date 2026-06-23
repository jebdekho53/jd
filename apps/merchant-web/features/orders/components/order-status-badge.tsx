import { Badge } from '@/design-system/primitives';
import type { BadgeProps } from '@/design-system/primitives';
import type { OrderStatus } from '@/types/order';

const STATUS_MAP: Record<OrderStatus, { tone: BadgeProps['tone']; label: string }> = {
  PAYMENT_PENDING: { tone: 'neutral', label: 'Payment Pending' },
  PAID: { tone: 'info', label: 'Paid — Awaiting Confirm' },
  MERCHANT_ACCEPTED: { tone: 'brand', label: 'Accepted' },
  PREPARING: { tone: 'warning', label: 'Preparing' },
  READY_FOR_PICKUP: { tone: 'success', label: 'Ready for Pickup' },
  OUT_FOR_DELIVERY: { tone: 'success', label: 'Out for Delivery' },
  DELIVERED: { tone: 'success', label: 'Delivered' },
  COMPLETED: { tone: 'success', label: 'Completed' },
  CANCELLED_BY_BUYER: { tone: 'danger', label: 'Cancelled by Buyer' },
  CANCELLED_BY_MERCHANT: { tone: 'danger', label: 'Cancelled by Merchant' },
  CANCELLED_BY_ADMIN: { tone: 'danger', label: 'Cancelled by Admin' },
  PAYMENT_FAILED: { tone: 'danger', label: 'Payment Failed' },
  REFUNDED: { tone: 'neutral', label: 'Refunded' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { tone, label } = STATUS_MAP[status] ?? { tone: 'neutral', label: status };
  return <Badge tone={tone} dot>{label}</Badge>;
}
