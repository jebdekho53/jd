import { isDeliveryOtpVisible } from './use-orders';

describe('isDeliveryOtpVisible (buyer delivery OTP gating)', () => {
  it('shows during active handover stages', () => {
    expect(isDeliveryOtpVisible('RIDER_ASSIGNED')).toBe(true);
    expect(isDeliveryOtpVisible('PICKED_UP')).toBe(true);
    expect(isDeliveryOtpVisible('OUT_FOR_DELIVERY')).toBe(true);
  });

  it('hides before a rider is on the job', () => {
    expect(isDeliveryOtpVisible('PAID')).toBe(false);
    expect(isDeliveryOtpVisible('PREPARING')).toBe(false);
    expect(isDeliveryOtpVisible('READY_FOR_PICKUP')).toBe(false);
  });

  it('hides after delivery / cancellation / terminal states', () => {
    expect(isDeliveryOtpVisible('DELIVERED')).toBe(false);
    expect(isDeliveryOtpVisible('COMPLETED')).toBe(false);
    expect(isDeliveryOtpVisible('CANCELLED_BY_BUYER')).toBe(false);
    expect(isDeliveryOtpVisible('CANCELLED_BY_MERCHANT')).toBe(false);
  });

  it('hides when status is unknown', () => {
    expect(isDeliveryOtpVisible(undefined)).toBe(false);
  });
});
