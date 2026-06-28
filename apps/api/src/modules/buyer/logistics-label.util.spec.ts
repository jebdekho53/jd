import { StoreType } from '@prisma/client';
import {
  deliveryProviderTypeToLabel,
  normalizeDeliveryPartnerLabel,
  resolveStoreDeliveryPartnerLabel,
} from './logistics-label.util';

describe('logistics-label.util', () => {
  it('normalizes provider keys to labels', () => {
    expect(normalizeDeliveryPartnerLabel('shadowfax')).toBe('Shadowfax');
    expect(normalizeDeliveryPartnerLabel('OWN_FLEET')).toBe('JebDekho Fleet');
    expect(normalizeDeliveryPartnerLabel('unknown')).toBe('JebDekho Partner');
  });

  it('uses platform default for retail stores', () => {
    expect(
      resolveStoreDeliveryPartnerLabel({ storeType: StoreType.RETAIL_STORE }, 'shadowfax', true),
    ).toBe('Shadowfax');
  });

  it('uses own fleet for dark stores when enabled', () => {
    expect(
      resolveStoreDeliveryPartnerLabel({ storeType: StoreType.DARK_STORE }, 'shadowfax', true),
    ).toBe('JebDekho Fleet');
  });

  it('falls back to platform when own fleet disabled', () => {
    expect(
      resolveStoreDeliveryPartnerLabel({ storeType: StoreType.WAREHOUSE }, 'porter', false),
    ).toBe('Porter');
  });

  it('maps delivery provider enum to label', () => {
    expect(deliveryProviderTypeToLabel('DELHIVERY' as never)).toBe('Delhivery');
  });
});
