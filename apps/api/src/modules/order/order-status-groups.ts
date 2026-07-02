import { OrderStatus } from '@prisma/client';
import { MERCHANT_ACTIVE_LIVE_STATUSES } from './merchant-pipeline.util';

export const BUYER_STATUS_GROUPS = {
  active: [
    OrderStatus.PAYMENT_PENDING,
    OrderStatus.PAID,
    OrderStatus.CREATED,
    OrderStatus.MERCHANT_ACCEPTED,
    OrderStatus.PREPARING,
    OrderStatus.PACKING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.RIDER_ASSIGNED,
    OrderStatus.PICKED_UP,
    OrderStatus.OUT_FOR_DELIVERY,
  ],
  cancelled: [
    OrderStatus.CANCELLED_BY_BUYER,
    OrderStatus.CANCELLED_BY_MERCHANT,
    OrderStatus.CANCELLED_BY_ADMIN,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.DELIVERY_FAILED,
    // Auto-expired unpaid orders live in the buyer's past list (not "active"),
    // shown with their own "Expired" badge — never as pending.
    OrderStatus.EXPIRED,
  ],
  completed: [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.REFUNDED],
} as const satisfies Record<string, OrderStatus[]>;

export const MERCHANT_STATUS_GROUPS = {
  active: MERCHANT_ACTIVE_LIVE_STATUSES,
  new: [OrderStatus.PAID, OrderStatus.MERCHANT_ACCEPTED],
  accepted: [OrderStatus.MERCHANT_ACCEPTED],
  preparing: [OrderStatus.PREPARING],
  packing: [OrderStatus.PACKING],
  ready_for_pickup: [OrderStatus.READY_FOR_PICKUP],
  rider_assigned: [OrderStatus.RIDER_ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
  delivered: [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
  cancelled: [
    OrderStatus.CANCELLED_BY_BUYER,
    OrderStatus.CANCELLED_BY_MERCHANT,
    OrderStatus.CANCELLED_BY_ADMIN,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.DELIVERY_FAILED,
  ],
} as const satisfies Record<string, OrderStatus[]>;

export type BuyerStatusGroup = keyof typeof BUYER_STATUS_GROUPS;
export type MerchantStatusGroup = keyof typeof MERCHANT_STATUS_GROUPS;
