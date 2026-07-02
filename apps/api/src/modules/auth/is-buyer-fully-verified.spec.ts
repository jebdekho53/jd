import { isBuyerFullyVerified } from './auth.service';

describe('isBuyerFullyVerified', () => {
  const base = {
    name: 'Asha',
    phone: '9990001111',
    email: 'asha@example.com',
    phoneVerified: true,
    emailVerified: true,
  };

  it('is true when all three fields present and both are OTP-verified', () => {
    expect(isBuyerFullyVerified(base)).toBe(true);
  });

  it('is false when email is missing', () => {
    expect(isBuyerFullyVerified({ ...base, email: null })).toBe(false);
  });

  it('is false when name is missing', () => {
    expect(isBuyerFullyVerified({ ...base, name: '   ' })).toBe(false);
  });

  it('does NOT bypass OTP: false when phone is not verified', () => {
    expect(isBuyerFullyVerified({ ...base, phoneVerified: false })).toBe(false);
  });

  it('does NOT bypass OTP: false when email is not verified', () => {
    expect(isBuyerFullyVerified({ ...base, emailVerified: false })).toBe(false);
  });
});
