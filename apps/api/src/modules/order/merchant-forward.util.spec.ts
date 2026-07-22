import { OrderStatus, OrderVertical } from '@prisma/client';
import { merchantForwardMap, SELF_DELIVERY_MERCHANT_FORWARD } from './merchant-forward.util';

/**
 * Regression cover for the self-delivery completion gap: a SELF-delivery store
 * gets no rider/3PL (DeliveryDispatchService skips them), so without this map
 * merchantForwardMap alone left every self-delivered order stuck at
 * READY_FOR_PICKUP forever — no rider or 3PL webhook exists to advance it.
 */
describe('SELF_DELIVERY_MERCHANT_FORWARD', () => {
  it('only offers a next step from READY_FOR_PICKUP and OUT_FOR_DELIVERY', () => {
    expect(SELF_DELIVERY_MERCHANT_FORWARD[OrderStatus.READY_FOR_PICKUP]).toBe(
      OrderStatus.OUT_FOR_DELIVERY,
    );
    expect(SELF_DELIVERY_MERCHANT_FORWARD[OrderStatus.OUT_FOR_DELIVERY]).toBe(
      OrderStatus.DELIVERED,
    );
  });

  it('does not overlap with the platform-delivery forward maps', () => {
    for (const vertical of [OrderVertical.FOOD, OrderVertical.GROCERY]) {
      const forwardMap = merchantForwardMap(vertical);
      // The ordinary (rider/3PL) merchant flow must never itself claim it can
      // reach READY_FOR_PICKUP's next step or beyond — that stays gated behind
      // a store actually being SELF-delivery.
      expect(forwardMap[OrderStatus.READY_FOR_PICKUP]).toBeUndefined();
      expect(forwardMap[OrderStatus.OUT_FOR_DELIVERY]).toBeUndefined();
    }
  });
});
