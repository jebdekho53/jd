import { isPickupOtpVisible } from './pickup-otp-visibility';

describe('isPickupOtpVisible (merchant pickup OTP gating)', () => {
  it('shows while the rider is on the way to / at the store', () => {
    expect(isPickupOtpVisible('ASSIGNED')).toBe(true);
    expect(isPickupOtpVisible('ACCEPTED')).toBe(true);
    expect(isPickupOtpVisible('ARRIVED_AT_STORE')).toBe(true);
  });

  it('hides once the order is picked up', () => {
    expect(isPickupOtpVisible('PICKED_UP')).toBe(false);
    expect(isPickupOtpVisible('IN_TRANSIT')).toBe(false);
    expect(isPickupOtpVisible('ARRIVED_AT_CUSTOMER')).toBe(false);
  });

  it('hides on terminal delivery states', () => {
    expect(isPickupOtpVisible('DELIVERED')).toBe(false);
    expect(isPickupOtpVisible('FAILED')).toBe(false);
    expect(isPickupOtpVisible('CANCELLED')).toBe(false);
  });
});
