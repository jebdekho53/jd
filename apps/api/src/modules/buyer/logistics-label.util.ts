import { DeliveryProviderType, StoreType } from '@prisma/client';

/** Human-readable delivery partner labels for buyer UI. */
export function normalizeDeliveryPartnerLabel(provider?: string | null): string {
  const key = (provider ?? 'shadowfax').toLowerCase().replace(/-/g, '_');
  switch (key) {
    case 'shadowfax':
      return 'Shadowfax';
    case 'own_fleet':
    case 'ownfleet':
      return 'JebDekho Fleet';
    case 'porter':
      return 'Porter';
    case 'delhivery':
      return 'Delhivery';
    case 'borzo':
      return 'Borzo';
    default:
      return 'JebDekho Partner';
  }
}

export function deliveryProviderTypeToKey(type: DeliveryProviderType): string {
  switch (type) {
    case DeliveryProviderType.SHADOWFAX:
      return 'shadowfax';
    case DeliveryProviderType.OWN_FLEET:
      return 'own_fleet';
    case DeliveryProviderType.PORTER:
      return 'porter';
    case DeliveryProviderType.DELHIVERY:
      return 'delhivery';
    case DeliveryProviderType.BORZO:
      return 'borzo';
    default:
      return 'shadowfax';
  }
}

export function deliveryProviderTypeToLabel(type: DeliveryProviderType): string {
  return normalizeDeliveryPartnerLabel(deliveryProviderTypeToKey(type));
}

const FLEET_STORE_TYPES: StoreType[] = [
  StoreType.DARK_STORE,
  StoreType.WAREHOUSE,
  StoreType.MICRO_FULFILLMENT_CENTER,
];

/** Resolve per-store delivery partner label; platform default when store has no override. */
export function resolveStoreDeliveryPartnerLabel(
  store: { storeType?: StoreType | null; preferredDeliveryProvider?: DeliveryProviderType | null },
  platformProviderKey: string,
  ownFleetEnabled = false,
): string {
  if (store.preferredDeliveryProvider) {
    return deliveryProviderTypeToLabel(store.preferredDeliveryProvider);
  }
  if (store.storeType && FLEET_STORE_TYPES.includes(store.storeType) && ownFleetEnabled) {
    return normalizeDeliveryPartnerLabel('own_fleet');
  }
  return normalizeDeliveryPartnerLabel(platformProviderKey);
}
