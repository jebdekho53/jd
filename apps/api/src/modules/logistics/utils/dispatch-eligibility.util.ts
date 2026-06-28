import { OrderStatus } from '@prisma/client';

/** Order statuses eligible for third-party logistics dispatch (Shadowfax, etc.). */
export const DISPATCH_ELIGIBLE_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.PAID,
  OrderStatus.MERCHANT_ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.PACKING,
  OrderStatus.READY_FOR_PICKUP,
]);

export function isDispatchEligibleOrderStatus(status: OrderStatus): boolean {
  return DISPATCH_ELIGIBLE_ORDER_STATUSES.has(status);
}
