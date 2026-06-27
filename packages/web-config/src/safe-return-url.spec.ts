import { safeReturnUrl, DEFAULT_RETURN_PATH } from './safe-return-url';

describe('safeReturnUrl', () => {
  it('returns fallback for null/undefined/empty', () => {
    expect(safeReturnUrl(null)).toBe(DEFAULT_RETURN_PATH);
    expect(safeReturnUrl(undefined)).toBe(DEFAULT_RETURN_PATH);
    expect(safeReturnUrl('')).toBe(DEFAULT_RETURN_PATH);
    expect(safeReturnUrl('   ')).toBe(DEFAULT_RETURN_PATH);
  });

  it('allows same-origin relative paths', () => {
    expect(safeReturnUrl('/cart')).toBe('/cart');
    expect(safeReturnUrl('/orders/abc123')).toBe('/orders/abc123');
    expect(safeReturnUrl('/checkout?step=2')).toBe('/checkout?step=2');
  });

  it('rejects external and protocol-relative URLs', () => {
    expect(safeReturnUrl('https://evil.com')).toBe(DEFAULT_RETURN_PATH);
    expect(safeReturnUrl('//evil.com')).toBe(DEFAULT_RETURN_PATH);
    expect(safeReturnUrl('/\\evil.com')).toBe(DEFAULT_RETURN_PATH);
  });

  it('rejects javascript and data schemes', () => {
    expect(safeReturnUrl('/javascript:alert(1)')).toBe(DEFAULT_RETURN_PATH);
    expect(safeReturnUrl('/data:text/html,hi')).toBe(DEFAULT_RETURN_PATH);
  });

  it('uses custom fallback', () => {
    expect(safeReturnUrl(null, '/dashboard')).toBe('/dashboard');
    expect(safeReturnUrl('https://evil.com', '/dashboard')).toBe('/dashboard');
  });
});
