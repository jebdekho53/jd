import { OrderStatus, OrderVertical } from '@prisma/client';
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
});
