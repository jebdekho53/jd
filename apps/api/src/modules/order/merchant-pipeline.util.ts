import { OrderStatus, PaymentMethod } from '@prisma/client';

export type MerchantPipelineColumn =
  | 'NEW'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PACKING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

const CANCELLED = new Set<OrderStatus>([
  OrderStatus.CANCELLED_BY_BUYER,
  OrderStatus.CANCELLED_BY_MERCHANT,
  OrderStatus.CANCELLED_BY_ADMIN,
  OrderStatus.PAYMENT_FAILED,
  OrderStatus.DELIVERY_FAILED,
]);

export const PIPELINE_COLUMN_STATUSES: Record<MerchantPipelineColumn, OrderStatus[]> = {
  NEW: [OrderStatus.PAID, OrderStatus.MERCHANT_ACCEPTED],
  ACCEPTED: [OrderStatus.MERCHANT_ACCEPTED],
  PREPARING: [OrderStatus.PREPARING],
  PACKING: [OrderStatus.PACKING],
  READY_FOR_PICKUP: [OrderStatus.READY_FOR_PICKUP],
  RIDER_ASSIGNED: [OrderStatus.RIDER_ASSIGNED, OrderStatus.PICKED_UP],
  OUT_FOR_DELIVERY: [OrderStatus.OUT_FOR_DELIVERY],
  DELIVERED: [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
  CANCELLED: [...CANCELLED],
};

export const MERCHANT_LIVE_STATUS_GROUPS = {
  incoming: [OrderStatus.PAID, OrderStatus.MERCHANT_ACCEPTED],
  preparation: [OrderStatus.PREPARING],
  packing: [OrderStatus.PACKING],
  ready: [OrderStatus.READY_FOR_PICKUP],
  dispatch: [OrderStatus.RIDER_ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
} as const satisfies Record<string, readonly OrderStatus[]>;

export const MERCHANT_ACTIVE_LIVE_STATUSES = Object.values(MERCHANT_LIVE_STATUS_GROUPS).flat();

export function resolvePipelineColumn(
  status: OrderStatus,
  paymentMethod?: PaymentMethod,
): MerchantPipelineColumn {
  if (CANCELLED.has(status)) return 'CANCELLED';
  if (status === OrderStatus.DELIVERED || status === OrderStatus.COMPLETED) return 'DELIVERED';
  if (status === OrderStatus.OUT_FOR_DELIVERY) return 'OUT_FOR_DELIVERY';
  if (status === OrderStatus.RIDER_ASSIGNED || status === OrderStatus.PICKED_UP) return 'RIDER_ASSIGNED';
  if (status === OrderStatus.READY_FOR_PICKUP) return 'READY_FOR_PICKUP';
  if (status === OrderStatus.PACKING) return 'PACKING';
  if (status === OrderStatus.PREPARING) return 'PREPARING';
  if (status === OrderStatus.MERCHANT_ACCEPTED) {
    return paymentMethod === PaymentMethod.COD ? 'NEW' : 'ACCEPTED';
  }
  return 'NEW';
}

/** SLA thresholds in minutes */
export const SLA_THRESHOLDS = {
  accept: { yellow: 5, red: 10 },
  prepare: { yellow: 15, red: 25 },
  pack: { yellow: 8, red: 15 },
  riderWait: { yellow: 10, red: 20 },
} as const;

export type SlaLevel = 'green' | 'yellow' | 'red';

export function slaLevel(elapsedMins: number, yellow: number, red: number): SlaLevel {
  if (elapsedMins >= red) return 'red';
  if (elapsedMins >= yellow) return 'yellow';
  return 'green';
}

export function minutesSince(date: Date | string | null | undefined): number {
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60_000));
}
