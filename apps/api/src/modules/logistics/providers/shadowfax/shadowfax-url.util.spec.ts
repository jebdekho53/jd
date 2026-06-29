import {
  assertSupportedShadowfaxPath,
  normalizeShadowfaxApiBase,
  resolveShadowfaxApiMode,
  shadowfaxRequestPath,
  shadowfaxRequestTarget,
} from './shadowfax-url.util';
import { shadowfaxEndpointsForMode } from './shadowfax.endpoints';

describe('shadowfax-url.util', () => {
  it('normalizes v3 base URL to one /api segment', () => {
    expect(normalizeShadowfaxApiBase('https://dale.shadowfax.in')).toBe(
      'https://dale.shadowfax.in/api',
    );
    expect(normalizeShadowfaxApiBase('https://dale.shadowfax.in/api')).toBe(
      'https://dale.shadowfax.in/api',
    );
    expect(normalizeShadowfaxApiBase('https://dale.shadowfax.in/api/v3/')).toBe(
      'https://dale.shadowfax.in/api',
    );
  });

  it('detects flash mode from hlbackend host', () => {
    expect(
      resolveShadowfaxApiMode('https://hlbackend.staging.shadowfax.in', ''),
    ).toBe('flash');
  });

  it('defaults v3 mode to marketplace for generic host', () => {
    expect(resolveShadowfaxApiMode('https://dale.shadowfax.in/api', '')).toBe('v3_marketplace');
  });

  it('respects explicit SHADOWFAX_API_MODE', () => {
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'flash')).toBe('flash');
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'v3_warehouse')).toBe('v3_warehouse');
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'v3_marketplace')).toBe('v3_marketplace');
  });

  it('selects marketplace and warehouse endpoints', () => {
    expect(shadowfaxEndpointsForMode('v3_marketplace').createOrder).toBe('/v3/clients/orders/');
    expect(shadowfaxEndpointsForMode('v3_warehouse').createOrder).toBe('/v3/clients/shipments/');
  });

  it('formats request target as host + path only', () => {
    expect(
      shadowfaxRequestTarget('https://dale.shadowfax.in/api', '/v3/clients/orders/'),
    ).toBe('dale.shadowfax.in/api/v3/clients/orders/');
  });

  it('does not create double /api/api request paths', () => {
    const base = normalizeShadowfaxApiBase('https://dale.shadowfax.in/api/api');

    expect(shadowfaxRequestPath(base, '/v3/clients/orders/')).toBe('/api/v3/clients/orders/');
    expect(shadowfaxRequestPath(base, '/v3/clients/orders/')).not.toContain('/api/api/');
  });

  it('rejects unsupported endpoint paths in marketplace mode', () => {
    expect(() => assertSupportedShadowfaxPath('v3_marketplace', '/api/v3/clients/shipments/')).toThrow(
      /relative to \/api base/,
    );
    expect(() => assertSupportedShadowfaxPath('v3_marketplace', '/v3/clients/shipments/')).toThrow(
      /marketplace mode/,
    );
  });
});
