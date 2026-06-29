import { groupLiveOrders, liveOrderGroupForStatus, LIVE_ORDER_ACTIVE_STATUSES } from './live-order-groups';
import type { MerchantOrderListItem, OrderStatus, PaymentMethod } from '@/types/order';

function order(status: OrderStatus, paymentMethod: PaymentMethod = 'COD'): MerchantOrderListItem {
  return {
    id: status,
    orderNumber: status,
    status,
    paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
    totalAmount: 100,
    createdAt: new Date().toISOString(),
    items: [],
  };
}

describe('live order groups', () => {
  it('maps active statuses to the live columns', () => {
    expect(liveOrderGroupForStatus('MERCHANT_ACCEPTED')).toBe('incoming');
    expect(liveOrderGroupForStatus('PREPARING')).toBe('prep');
    expect(liveOrderGroupForStatus('READY_FOR_PICKUP')).toBe('ready');
    expect(liveOrderGroupForStatus('RIDER_ASSIGNED')).toBe('dispatch');
    expect(liveOrderGroupForStatus('OUT_FOR_DELIVERY')).toBe('dispatch');
  });

  it('does not map hidden or terminal statuses to live columns', () => {
    expect(liveOrderGroupForStatus('PAYMENT_PENDING')).toBeNull();
    expect(liveOrderGroupForStatus('PAYMENT_FAILED')).toBeNull();
    expect(liveOrderGroupForStatus('CANCELLED_BY_MERCHANT')).toBeNull();
    expect(liveOrderGroupForStatus('REFUNDED')).toBeNull();
    expect(liveOrderGroupForStatus('DELIVERED')).toBeNull();
  });

  it('groups COD accepted and active pipeline orders for the live page', () => {
    const grouped = groupLiveOrders([
      order('MERCHANT_ACCEPTED'),
      order('PREPARING'),
      order('READY_FOR_PICKUP'),
      order('RIDER_ASSIGNED'),
      order('PAYMENT_PENDING', 'RAZORPAY'),
    ]);

    expect(grouped.incoming).toHaveLength(1);
    expect(grouped.prep).toHaveLength(1);
    expect(grouped.ready).toHaveLength(1);
    expect(grouped.dispatch).toHaveLength(1);
  });

  it('keeps active status list aligned with API active merchant group', () => {
    expect(LIVE_ORDER_ACTIVE_STATUSES).toEqual([
      'PAID',
      'MERCHANT_ACCEPTED',
      'PREPARING',
      'PACKING',
      'READY_FOR_PICKUP',
      'RIDER_ASSIGNED',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
    ]);
  });
});
