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
        { status: { notIn: [OrderStatus.CREATED, OrderStatus.PAYMENT_PENDING] } },
      ]),
    });
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

  it('dispatch requires paid status for online orders', () => {
    expect(isDispatchPaymentCleared(PaymentMethod.COD, PaymentStatus.PENDING)).toBe(true);
    expect(isDispatchPaymentCleared(PaymentMethod.RAZORPAY, PaymentStatus.PAID)).toBe(true);
    expect(isDispatchPaymentCleared(PaymentMethod.RAZORPAY, PaymentStatus.PENDING)).toBe(false);
  });
});
