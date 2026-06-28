import {
  normalizeShadowfaxApiBase,
  resolveShadowfaxApiMode,
  shadowfaxRequestTarget,
} from './shadowfax-url.util';

describe('shadowfax-url.util', () => {
  it('strips duplicate /api/v3 suffix from base URL', () => {
    expect(normalizeShadowfaxApiBase('https://api.example.com/api/v3/')).toBe(
      'https://api.example.com',
    );
  });

  it('detects flash mode from hlbackend host', () => {
    expect(
      resolveShadowfaxApiMode('https://hlbackend.staging.shadowfax.in', ''),
    ).toBe('flash');
  });

  it('detects v3 mode for generic host', () => {
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', '')).toBe('v3');
  });

  it('respects explicit SHADOWFAX_API_MODE', () => {
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'flash')).toBe('flash');
  });

  it('formats request target as host + path only', () => {
    expect(
      shadowfaxRequestTarget('https://flash-api.shadowfax.in', '/order/create/'),
    ).toBe('flash-api.shadowfax.in/order/create/');
  });
});
