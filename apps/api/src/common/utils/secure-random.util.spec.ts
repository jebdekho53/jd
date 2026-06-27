import { secureNumericCode, secureRandomInt } from './secure-random.util';

describe('secure-random.util', () => {
  it('secureRandomInt stays within bounds', () => {
    for (let i = 0; i < 50; i++) {
      const n = secureRandomInt(100, 999);
      expect(n).toBeGreaterThanOrEqual(100);
      expect(n).toBeLessThanOrEqual(999);
    }
  });

  it('secureNumericCode returns correct length', () => {
    const code = secureNumericCode(6);
    expect(code).toMatch(/^\d{6}$/);
  });
});
