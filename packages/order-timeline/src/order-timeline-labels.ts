export type TimelineStatus =
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'MERCHANT_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'ARRIVED_AT_STORE'
  | 'ARRIVED_AT_CUSTOMER'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED_BY_BUYER'
  | 'CANCELLED_BY_MERCHANT'
  | 'CANCELLED_BY_ADMIN'
  | 'PAYMENT_FAILED'
  | 'DELIVERY_FAILED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CREATED'
  | string;

export interface OrderTimelineEntry {
  status: TimelineStatus;
  note?: string | null;
  changedBy?: string | null;
  actorType?: string | null;
  createdAt: string | Date;
}

export const ORDER_TIMELINE_LABELS: Record<string, string> = {
  CREATED: 'Order placed',
  PAYMENT_PENDING: 'Payment pending',
  PAID: 'Payment confirmed',
  MERCHANT_ACCEPTED: 'Merchant accepted',
  PREPARING: 'Preparing',
  PACKING: 'Packing',
  READY_FOR_PICKUP: 'Ready for pickup',
  RIDER_ASSIGNED: 'Rider assigned',
  PICKED_UP: 'Picked up',
  ARRIVED_AT_STORE: 'Arrived at store',
  ARRIVED_AT_CUSTOMER: 'Arrived at customer',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  COMPLETED: 'Order completed',
  CANCELLED_BY_BUYER: 'Cancelled by buyer',
  CANCELLED_BY_MERCHANT: 'Cancelled by store',
  CANCELLED_BY_ADMIN: 'Cancelled by admin',
  PAYMENT_FAILED: 'Payment failed',
  DELIVERY_FAILED: 'Delivery failed',
  FAILED: 'Delivery failed',
  REFUNDED: 'Refunded',
};

export function timelineLabel(status: string): string {
  return ORDER_TIMELINE_LABELS[status] ?? status.replace(/_/g, ' ');
}
