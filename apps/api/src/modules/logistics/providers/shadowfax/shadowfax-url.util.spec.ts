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


  it('detects verified Dale staging and production hosts', () => {
    expect(resolveShadowfaxApiMode('https://dale.staging.shadowfax.in', '')).toBe('dale_staging');
    expect(resolveShadowfaxApiMode('https://dale.shadowfax.in/api', '')).toBe('dale_production');
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'staging')).toBe('dale_staging');
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'production')).toBe('dale_production');
    expect(normalizeShadowfaxApiBase('https://dale.staging.shadowfax.in/api/v1', 'dale_staging')).toBe('https://dale.staging.shadowfax.in');
    expect(normalizeShadowfaxApiBase('https://dale.shadowfax.in/api', 'dale_production')).toBe('https://dale.shadowfax.in');
    expect(shadowfaxEndpointsForMode('dale_staging').serviceability).toBe('/api/v1/clients/serviceability/');
  });

  it('detects documented legacy and HL staging modes', () => {
    expect(resolveShadowfaxApiMode('https://hlbackend.staging.shadowfax.in', '')).toBe('hl_staging');
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'hl_staging')).toBe('hl_staging');
    expect(normalizeShadowfaxApiBase('https://hlbackend.staging.shadowfax.in/api/v1', 'hl_staging')).toBe('https://hlbackend.staging.shadowfax.in');
    expect(shadowfaxEndpointsForMode('hl_staging').serviceability).toBe('/api/v1/order-serviceability/');
  });

  it('detects documented legacy host and respects explicit legacy mode', () => {
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', '')).toBe('legacy');
    expect(resolveShadowfaxApiMode('https://dale.shadowfax.in/api', 'legacy')).toBe('legacy');
    expect(normalizeShadowfaxApiBase('https://api.shadowfax.in/api/v1', 'legacy')).toBe('https://api.shadowfax.in');
    expect(shadowfaxEndpointsForMode('legacy').serviceability).toBe('/api/v1/order-serviceability/');
  });

  it('respects explicit SHADOWFAX_API_MODE', () => {
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'flash')).toBe('flash');
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'v3_warehouse')).toBe('v3_warehouse');
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'v3_marketplace')).toBe('v3_marketplace');
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'dale_staging')).toBe('dale_staging');
    expect(resolveShadowfaxApiMode('https://api.shadowfax.in', 'dale_production')).toBe('dale_production');
  });

  it('selects marketplace and warehouse endpoints', () => {
    expect(shadowfaxEndpointsForMode('v3_marketplace').createOrder).toBe('/v3/clients/orders/');
    expect(shadowfaxEndpointsForMode('v3_warehouse').createOrder).toBe('/v3/clients/shipments/');
    expect(shadowfaxEndpointsForMode('v3_marketplace').serviceability).toBe('/v1/clients/serviceability/');
    expect(shadowfaxEndpointsForMode('v3_warehouse').serviceability).toBe('/v1/clients/serviceability/');
  });

  it('formats request target as host + path only', () => {
    expect(
      shadowfaxRequestTarget('https://dale.shadowfax.in/api', '/v3/clients/orders/'),
    ).toBe('dale.shadowfax.in/api/v3/clients/orders/');
    expect(
      shadowfaxRequestTarget('https://dale.shadowfax.in', '/api/v1/clients/serviceability/'),
    ).toBe('dale.shadowfax.in/api/v1/clients/serviceability/');
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
