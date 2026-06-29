import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import {
  buildMerchantListWhere,
  isDispatchPaymentCleared,
  merchantDefaultVisibleWhere,
  merchantNewTabWhere,
} from './merchant-order-visibility.util';

describe('merchant-order-visibility', () => {
  it('default visibility excludes unpaid online orders', () => {
    const where = merchantDefaultVisibleWhere();
    expect(where).toMatchObject({
      AND: expect.arrayContaining([
        {
          status: {
            notIn: expect.arrayContaining([
              OrderStatus.CREATED,
              OrderStatus.PAYMENT_PENDING,
              OrderStatus.PAYMENT_FAILED,
              OrderStatus.CANCELLED_BY_BUYER,
              OrderStatus.CANCELLED_BY_MERCHANT,
              OrderStatus.CANCELLED_BY_ADMIN,
              OrderStatus.REFUNDED,
            ]),
          },
        },
      ]),
    });
  });

  it('default merchant orders include COD accepted and preparation statuses', () => {
    const serialized = JSON.stringify(merchantDefaultVisibleWhere());
    expect(serialized).toContain(PaymentMethod.COD);
    expect(serialized).not.toContain(`"in":["${OrderStatus.MERCHANT_ACCEPTED}"]`);

    for (const status of [
      OrderStatus.MERCHANT_ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.RIDER_ASSIGNED,
      OrderStatus.OUT_FOR_DELIVERY,
    ]) {
      expect(JSON.stringify(buildMerchantListWhere({ status }))).toContain(status);
      expect(JSON.stringify(buildMerchantListWhere({ status }))).toContain(PaymentStatus.PAID);
    }
  });

  it('NEW tab includes COD MERCHANT_ACCEPTED and paid online', () => {
    const where = merchantNewTabWhere();
    expect(JSON.stringify(where)).toContain(OrderStatus.PAID);
    expect(JSON.stringify(where)).toContain(OrderStatus.MERCHANT_ACCEPTED);
    expect(JSON.stringify(where)).toContain(PaymentMethod.COD);
  });

  it('buildMerchantListWhere keeps cancelled filter without payment gate', () => {
    const where = buildMerchantListWhere({
      merchantStatusGroup: 'cancelled',
    });
    expect(JSON.stringify(where)).toContain(OrderStatus.PAYMENT_FAILED);
  });

  it('active live group includes active pipeline statuses and hides unpaid statuses', () => {
    const serialized = JSON.stringify(buildMerchantListWhere({ merchantStatusGroup: 'active' }));
    for (const status of [
      OrderStatus.PAID,
      OrderStatus.MERCHANT_ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.PACKING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.RIDER_ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.OUT_FOR_DELIVERY,
    ]) {
      expect(serialized).toContain(status);
    }
    expect(serialized).not.toContain(OrderStatus.PAYMENT_PENDING);
    expect(serialized).not.toContain(OrderStatus.CREATED);
  });

  it('dispatch requires paid status for online orders', () => {
    expect(isDispatchPaymentCleared(PaymentMethod.COD, PaymentStatus.PENDING)).toBe(true);
    expect(isDispatchPaymentCleared(PaymentMethod.RAZORPAY, PaymentStatus.PAID)).toBe(true);
    expect(isDispatchPaymentCleared(PaymentMethod.RAZORPAY, PaymentStatus.PENDING)).toBe(false);
  });
});
