import {
  getOrderStatusStageIndex,
  getOrderStatusStageLabel,
  ORDER_STATUS_STAGES,
} from './order-status-stage';

describe('order-status-stage', () => {
  it('maps early statuses to placed', () => {
    expect(getOrderStatusStageIndex('PAID')).toBe(0);
    expect(getOrderStatusStageLabel('PAID')).toBe('Order placed');
  });

  it('maps merchant accepted to confirmed', () => {
    expect(getOrderStatusStageIndex('MERCHANT_ACCEPTED')).toBe(1);
    expect(getOrderStatusStageLabel('MERCHANT_ACCEPTED')).toBe('Order confirmed');
  });

  it('maps preparing and packing separately', () => {
    expect(getOrderStatusStageLabel('PREPARING')).toBe('Store is preparing');
    expect(getOrderStatusStageLabel('PACKING')).toBe('Packing your order');
  });

  it('maps rider and delivery statuses', () => {
    expect(getOrderStatusStageLabel('RIDER_ASSIGNED')).toBe('Delivery partner being allocated…');
    expect(getOrderStatusStageLabel('OUT_FOR_DELIVERY')).toBe('On the way');
    expect(getOrderStatusStageLabel('DELIVERED')).toBe('Delivered');
  });

  it('defines contiguous stage keys', () => {
    expect(ORDER_STATUS_STAGES.length).toBeGreaterThanOrEqual(6);
  });
});
