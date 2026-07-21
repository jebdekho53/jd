import { OrderStatus, PaymentMethod } from '@prisma/client';
import {
  minutesSince,
  resolvePipelineColumn,
  slaLevel,
  SLA_THRESHOLDS,
} from './merchant-pipeline.util';

describe('resolvePipelineColumn', () => {
  it('maps terminal/cancelled statuses to CANCELLED', () => {
    for (const s of [
      OrderStatus.CANCELLED_BY_BUYER,
      OrderStatus.CANCELLED_BY_MERCHANT,
      OrderStatus.CANCELLED_BY_ADMIN,
      OrderStatus.PAYMENT_FAILED,
      OrderStatus.DELIVERY_FAILED,
    ]) {
      expect(resolvePipelineColumn(s)).toBe('CANCELLED');
    }
  });

  it('maps delivered/completed to DELIVERED', () => {
    expect(resolvePipelineColumn(OrderStatus.DELIVERED)).toBe('DELIVERED');
    expect(resolvePipelineColumn(OrderStatus.COMPLETED)).toBe('DELIVERED');
  });

  it('groups rider-assigned and picked-up into RIDER_ASSIGNED', () => {
    expect(resolvePipelineColumn(OrderStatus.RIDER_ASSIGNED)).toBe('RIDER_ASSIGNED');
    expect(resolvePipelineColumn(OrderStatus.PICKED_UP)).toBe('RIDER_ASSIGNED');
  });

  it('routes MERCHANT_ACCEPTED by payment method (COD stays in NEW, prepaid to ACCEPTED)', () => {
    expect(resolvePipelineColumn(OrderStatus.MERCHANT_ACCEPTED, PaymentMethod.COD)).toBe('NEW');
    expect(resolvePipelineColumn(OrderStatus.MERCHANT_ACCEPTED, PaymentMethod.RAZORPAY)).toBe(
      'ACCEPTED',
    );
  });

  it('defaults an unknown/early status to NEW', () => {
    expect(resolvePipelineColumn(OrderStatus.PAID)).toBe('NEW');
  });
});

describe('slaLevel', () => {
  const { yellow, red } = SLA_THRESHOLDS.prepare;

  it('is green below the yellow threshold', () => {
    expect(slaLevel(yellow - 1, yellow, red)).toBe('green');
  });

  it('is yellow between yellow and red', () => {
    expect(slaLevel(yellow, yellow, red)).toBe('yellow');
    expect(slaLevel(red - 1, yellow, red)).toBe('yellow');
  });

  it('is red at or beyond the red threshold', () => {
    expect(slaLevel(red, yellow, red)).toBe('red');
    expect(slaLevel(red + 100, yellow, red)).toBe('red');
  });
});

describe('minutesSince', () => {
  it('returns 0 for null/undefined', () => {
    expect(minutesSince(null)).toBe(0);
    expect(minutesSince(undefined)).toBe(0);
  });

  it('never returns a negative value for a future date', () => {
    const future = new Date(Date.now() + 60_000);
    expect(minutesSince(future)).toBe(0);
  });

  it('computes elapsed whole minutes for a past date', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60_000);
    expect(minutesSince(tenMinAgo)).toBe(10);
  });
});
