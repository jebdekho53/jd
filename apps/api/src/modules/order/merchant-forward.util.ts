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

/**
 * Self-delivery stores get no rider or 3PL shipment (see DeliveryDispatchService —
 * dispatchAfterReadyForPickup skips them entirely), so the merchant IS the delivery
 * agent. Without these, a SELF-delivery order was stuck at READY_FOR_PICKUP forever:
 * merchantForwardMap has no entry past it, and only a rider/3PL webhook can reach
 * DELIVERED. This map is only consulted for stores with deliveryMode === 'SELF'.
 */
export const SELF_DELIVERY_MERCHANT_FORWARD: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.READY_FOR_PICKUP]: OrderStatus.OUT_FOR_DELIVERY,
  [OrderStatus.OUT_FOR_DELIVERY]: OrderStatus.DELIVERED,
};
