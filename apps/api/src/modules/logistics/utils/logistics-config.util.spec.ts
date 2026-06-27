import { ConfigService } from '@nestjs/config';
import { DeliveryProviderType } from '@prisma/client';
import { resolvePrimaryProviderType, useOwnFleetDispatch } from './logistics-config.util';

function mockConfig(values: Record<string, string>): ConfigService {
  return {
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  } as ConfigService;
}

describe('logistics-config.util', () => {
  it('selects DELIVERY_PROVIDER when enabled', () => {
    const config = mockConfig({
      DELIVERY_PROVIDER: 'shadowfax',
      ENABLE_SHADOWFAX: 'true',
      ENABLE_OWN_FLEET: 'false',
    });
    expect(resolvePrimaryProviderType(config)).toBe(DeliveryProviderType.SHADOWFAX);
  });

  it('falls back to shadowfax when requested provider disabled', () => {
    const config = mockConfig({
      DELIVERY_PROVIDER: 'porter',
      ENABLE_PORTER: 'false',
      ENABLE_SHADOWFAX: 'true',
    });
    expect(resolvePrimaryProviderType(config)).toBe(DeliveryProviderType.SHADOWFAX);
  });

  it('uses own fleet dispatch only when enabled and primary', () => {
    const config = mockConfig({
      DELIVERY_PROVIDER: 'own_fleet',
      ENABLE_OWN_FLEET: 'true',
      ENABLE_SHADOWFAX: 'true',
    });
    expect(useOwnFleetDispatch(config)).toBe(true);
    expect(resolvePrimaryProviderType(config)).toBe(DeliveryProviderType.OWN_FLEET);
  });

  it('does not use own fleet when shadowfax is primary', () => {
    const config = mockConfig({
      DELIVERY_PROVIDER: 'shadowfax',
      ENABLE_OWN_FLEET: 'true',
      ENABLE_SHADOWFAX: 'true',
    });
    expect(useOwnFleetDispatch(config)).toBe(false);
  });
});
