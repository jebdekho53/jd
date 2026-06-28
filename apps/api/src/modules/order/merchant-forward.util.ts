import { OrderStatus, OrderVertical } from '@prisma/client';

/** Grocery merchant status progression (includes PACKING). */
export const GROCERY_MERCHANT_FORWARD: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.CREATED]: OrderStatus.MERCHANT_ACCEPTED,
  [OrderStatus.PAID]: OrderStatus.MERCHANT_ACCEPTED,
  [OrderStatus.MERCHANT_ACCEPTED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.PACKING,
  [OrderStatus.PACKING]: OrderStatus.READY_FOR_PICKUP,
};

/** Food merchant status progression (skips PACKING). */
export const FOOD_MERCHANT_FORWARD: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PAID]: OrderStatus.MERCHANT_ACCEPTED,
  [OrderStatus.MERCHANT_ACCEPTED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.READY_FOR_PICKUP,
};

export function merchantForwardMap(
  vertical: OrderVertical,
): Partial<Record<OrderStatus, OrderStatus>> {
  return vertical === OrderVertical.FOOD ? FOOD_MERCHANT_FORWARD : GROCERY_MERCHANT_FORWARD;
}
