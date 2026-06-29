import { OrderStatus, OrderVertical } from '@prisma/client';
import { MERCHANT_ACTIVE_LIVE_STATUSES, MERCHANT_LIVE_STATUS_GROUPS } from './merchant-pipeline.util';
import { merchantForwardMap } from './merchant-forward.util';

describe('merchantForwardMap', () => {
  it('routes grocery orders through packing before ready for pickup', () => {
    const map = merchantForwardMap(OrderVertical.GROCERY);
    expect(map[OrderStatus.MERCHANT_ACCEPTED]).toBe(OrderStatus.PREPARING);
    expect(map[OrderStatus.PREPARING]).toBe(OrderStatus.PACKING);
    expect(map[OrderStatus.PACKING]).toBe(OrderStatus.READY_FOR_PICKUP);
  });

  it('routes food orders from preparing directly to ready for pickup', () => {
    const map = merchantForwardMap(OrderVertical.FOOD);
    expect(map[OrderStatus.MERCHANT_ACCEPTED]).toBe(OrderStatus.PREPARING);
    expect(map[OrderStatus.PREPARING]).toBe(OrderStatus.READY_FOR_PICKUP);
    expect(map[OrderStatus.PACKING]).toBeUndefined();
  });

  it('defines the shared live order grouping used by dashboard and live page', () => {
    expect(MERCHANT_LIVE_STATUS_GROUPS.incoming).toEqual([
      OrderStatus.PAID,
      OrderStatus.MERCHANT_ACCEPTED,
    ]);
    expect(MERCHANT_LIVE_STATUS_GROUPS.preparation).toEqual([OrderStatus.PREPARING]);
    expect(MERCHANT_LIVE_STATUS_GROUPS.ready).toEqual([OrderStatus.READY_FOR_PICKUP]);
    expect(MERCHANT_LIVE_STATUS_GROUPS.dispatch).toEqual([
      OrderStatus.RIDER_ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.OUT_FOR_DELIVERY,
    ]);
    expect(MERCHANT_ACTIVE_LIVE_STATUSES).not.toContain(OrderStatus.PAYMENT_PENDING);
    expect(MERCHANT_ACTIVE_LIVE_STATUSES).not.toContain(OrderStatus.DELIVERED);
  });
});
