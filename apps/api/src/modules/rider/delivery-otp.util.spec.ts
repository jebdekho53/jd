import {
  HANDOVER_OTP_LENGTH,
  generateHandoverOtp,
  otpMatches,
} from './delivery-otp.util';

describe('generateHandoverOtp', () => {
  it('produces a zero-padded numeric code of the configured length', () => {
    for (let i = 0; i < 200; i++) {
      const otp = generateHandoverOtp();
      expect(otp).toHaveLength(HANDOVER_OTP_LENGTH);
      expect(otp).toMatch(/^\d+$/);
    }
  });

  it('respects a custom length', () => {
    expect(generateHandoverOtp(6)).toHaveLength(6);
  });
});

describe('otpMatches (constant-time compare)', () => {
  it('matches an identical code', () => {
    expect(otpMatches('1234', '1234')).toBe(true);
  });

  it('rejects a wrong code of equal length', () => {
    expect(otpMatches('1234', '5678')).toBe(false);
  });

  it('rejects a length mismatch without throwing', () => {
    expect(otpMatches('123', '1234')).toBe(false);
    expect(otpMatches('12345', '1234')).toBe(false);
  });

  it('rejects when the expected code is null/undefined/empty', () => {
    expect(otpMatches('1234', null)).toBe(false);
    expect(otpMatches('1234', undefined)).toBe(false);
    expect(otpMatches('1234', '')).toBe(false);
  });

  it('preserves leading zeros in comparison', () => {
    expect(otpMatches('0007', '0007')).toBe(true);
    expect(otpMatches('7', '0007')).toBe(false);
  });
});
