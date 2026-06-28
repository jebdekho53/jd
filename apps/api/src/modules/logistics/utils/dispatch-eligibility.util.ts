import { OrderStatus } from '@prisma/client';
import { OrderVertical } from '@prisma/client';

/** Grocery order statuses eligible for third-party logistics dispatch at order placement. */
export const GROCERY_DISPATCH_AT_PLACED_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.PAID,
  OrderStatus.MERCHANT_ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.PACKING,
  OrderStatus.READY_FOR_PICKUP,
]);

/** Food orders dispatch only when ready for pickup (restaurant prepared the order). */
export const FOOD_DISPATCH_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.READY_FOR_PICKUP,
]);

export function isDispatchEligibleOrderStatus(
  status: OrderStatus,
  orderVertical: OrderVertical = OrderVertical.GROCERY,
): boolean {
  if (orderVertical === OrderVertical.FOOD) {
    return FOOD_DISPATCH_STATUSES.has(status);
  }
  return GROCERY_DISPATCH_AT_PLACED_STATUSES.has(status);
}
