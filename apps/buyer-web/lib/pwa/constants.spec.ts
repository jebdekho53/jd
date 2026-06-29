import {
  isPrivateApiPath,
  isPrivateDocumentPath,
  isPublicBrowsePath,
  PRIVATE_API_PREFIXES,
} from './constants';

describe('PWA private cache rules', () => {
  it('marks sensitive document routes as private', () => {
    expect(isPrivateDocumentPath('/profile')).toBe(true);
    expect(isPrivateDocumentPath('/profile/addresses')).toBe(true);
    expect(isPrivateDocumentPath('/checkout')).toBe(true);
    expect(isPrivateDocumentPath('/plus')).toBe(true);
    expect(isPrivateDocumentPath('/stores')).toBe(false);
  });

  it('never caches authenticated buyer APIs', () => {
    const sensitive = [
      '/api/auth/me',
      '/api/auth/refresh',
      '/api/buyer/addresses',
      '/api/buyer/addresses/abc',
      '/api/buyer/wallet',
      '/api/buyer/referrals',
      '/api/buyer/support/tickets',
      '/api/buyer/crm/events',
      '/api/buyer/checkout',
      '/api/buyer/orders/1',
      '/api/buyer/payments/verify',
      '/api/corporate/wallet',
      '/api/buyer/notifications/push/status',
      '/api/buyer/offers/recommended',
    ];

    for (const path of sensitive) {
      expect(isPrivateApiPath(path)).toBe(true);
    }
  });

  it('routes search through dedicated SW handler, not generic page cache', () => {
    expect(isPublicBrowsePath('/search')).toBe(false);
    expect(isPublicBrowsePath('/products')).toBe(true);
  });

  it('lists all required private API prefixes', () => {
    expect(PRIVATE_API_PREFIXES).toEqual(
      expect.arrayContaining([
        '/api/auth',
        '/api/buyer',
        '/api/corporate',
      ]),
    );
    expect(PRIVATE_API_PREFIXES).toHaveLength(3);
  });
});
