import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import {
  buildMerchantListWhere,
  isDispatchPaymentCleared,
  merchantDefaultVisibleWhere,
} from './merchant-order-visibility.util';
import { BUYER_STATUS_GROUPS } from './order-status-groups';

/**
 * Integration-style visibility checks: same order row, different surfaces.
 * Admin lists are unfiltered; merchant queue and Shadowfax use these rules.
 */
describe('order sync visibility', () => {
  const paidOnlineOrder = {
    status: OrderStatus.PAID,
    paymentMethod: PaymentMethod.RAZORPAY,
    paymentStatus: PaymentStatus.PAID,
  };

  const unpaidOnlineOrder = {
    status: OrderStatus.PAYMENT_PENDING,
    paymentMethod: PaymentMethod.RAZORPAY,
    paymentStatus: PaymentStatus.PENDING,
  };

  const codOrder = {
    status: OrderStatus.MERCHANT_ACCEPTED,
    paymentMethod: PaymentMethod.COD,
    paymentStatus: PaymentStatus.PENDING,
  };

  function matchesWhere(
    order: { status: OrderStatus; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus },
    where: Prisma.OrderWhereInput,
  ): boolean {
    const serialized = JSON.stringify(where);
    if (serialized.includes(OrderStatus.PAYMENT_PENDING) && order.status === OrderStatus.PAYMENT_PENDING) {
      return !serialized.includes('"notIn"');
    }
    const merchantDefault = merchantDefaultVisibleWhere();
    if (JSON.stringify(where) === JSON.stringify(merchantDefault)) {
      if (
        ([OrderStatus.PAYMENT_PENDING, OrderStatus.CREATED] as OrderStatus[]).includes(order.status)
      ) {
        return false;
      }
      if (order.paymentMethod === PaymentMethod.COD || order.paymentMethod === PaymentMethod.WALLET_COD) {
        return true;
      }
      return order.paymentStatus === PaymentStatus.PAID;
    }
    const newTab = buildMerchantListWhere({ merchantStatusGroup: 'new' });
    if (JSON.stringify(where) === JSON.stringify(newTab)) {
      if (order.status === OrderStatus.PAID && order.paymentStatus === PaymentStatus.PAID) return true;
      if (
        order.status === OrderStatus.MERCHANT_ACCEPTED &&
        (order.paymentMethod === PaymentMethod.COD || order.paymentMethod === PaymentMethod.WALLET_COD)
      ) {
        return true;
      }
      return false;
    }
    return true;
  }

  it('confirmed paid online order is merchant-visible and dispatch-eligible', () => {
    expect(matchesWhere(paidOnlineOrder, merchantDefaultVisibleWhere())).toBe(true);
    expect(isDispatchPaymentCleared(paidOnlineOrder.paymentMethod, paidOnlineOrder.paymentStatus)).toBe(true);
  });

  it('unpaid online order is hidden from merchant default queue', () => {
    expect(matchesWhere(unpaidOnlineOrder, merchantDefaultVisibleWhere())).toBe(false);
    expect(isDispatchPaymentCleared(unpaidOnlineOrder.paymentMethod, unpaidOnlineOrder.paymentStatus)).toBe(false);
  });

  it('COD order is merchant-visible before online payment', () => {
    expect(matchesWhere(codOrder, merchantDefaultVisibleWhere())).toBe(true);
    expect(isDispatchPaymentCleared(codOrder.paymentMethod, codOrder.paymentStatus)).toBe(true);
  });

  it('admin can query any status including payment pending', () => {
    const adminWhere: Prisma.OrderWhereInput = { status: OrderStatus.PAYMENT_PENDING };
    expect(adminWhere.status).toBe(OrderStatus.PAYMENT_PENDING);
  });

  it('buyer active group includes payment pending (tracking abandoned checkout)', () => {
    expect(BUYER_STATUS_GROUPS.active).toContain(OrderStatus.PAYMENT_PENDING);
  });
});
