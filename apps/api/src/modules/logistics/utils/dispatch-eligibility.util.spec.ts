import { OrderStatus, OrderVertical } from '@prisma/client';
import {
  FOOD_DISPATCH_STATUSES,
  GROCERY_DISPATCH_AT_PLACED_STATUSES,
  isDispatchEligibleOrderStatus,
} from './dispatch-eligibility.util';

describe('dispatch-eligibility.util', () => {
  it('allows grocery dispatch at placement statuses', () => {
    expect(isDispatchEligibleOrderStatus(OrderStatus.MERCHANT_ACCEPTED, OrderVertical.GROCERY)).toBe(
      true,
    );
    expect(GROCERY_DISPATCH_AT_PLACED_STATUSES.has(OrderStatus.MERCHANT_ACCEPTED)).toBe(true);
  });

  it('food dispatches only at READY_FOR_PICKUP', () => {
    expect(isDispatchEligibleOrderStatus(OrderStatus.MERCHANT_ACCEPTED, OrderVertical.FOOD)).toBe(
      false,
    );
    expect(isDispatchEligibleOrderStatus(OrderStatus.READY_FOR_PICKUP, OrderVertical.FOOD)).toBe(
      true,
    );
    expect(FOOD_DISPATCH_STATUSES.has(OrderStatus.READY_FOR_PICKUP)).toBe(true);
  });
});
