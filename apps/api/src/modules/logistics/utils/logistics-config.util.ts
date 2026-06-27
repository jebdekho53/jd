import { ConfigService } from '@nestjs/config';
import { DeliveryProviderType } from '@prisma/client';

function flag(config: ConfigService, key: string, fallback = false): boolean {
  const raw = config.get<string>(key);
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true' || raw === '1';
}

export function resolvePrimaryProviderType(config: ConfigService): DeliveryProviderType {
  const requested = (config.get<string>('DELIVERY_PROVIDER', 'shadowfax') ?? 'shadowfax')
    .trim()
    .toLowerCase();

  const enabled: Record<string, boolean> = {
    shadowfax: flag(config, 'ENABLE_SHADOWFAX', true),
    porter: flag(config, 'ENABLE_PORTER', false),
    delhivery: flag(config, 'ENABLE_DELHIVERY', false),
    borzo: flag(config, 'ENABLE_BORZO', false),
    own_fleet: flag(config, 'ENABLE_OWN_FLEET', false),
  };

  const typeMap: Record<string, DeliveryProviderType> = {
    shadowfax: DeliveryProviderType.SHADOWFAX,
    porter: DeliveryProviderType.PORTER,
    delhivery: DeliveryProviderType.DELHIVERY,
    borzo: DeliveryProviderType.BORZO,
    own_fleet: DeliveryProviderType.OWN_FLEET,
  };

  const type = typeMap[requested];
  if (type && enabled[requested]) return type;

  if (enabled.shadowfax) return DeliveryProviderType.SHADOWFAX;
  if (enabled.own_fleet) return DeliveryProviderType.OWN_FLEET;
  if (enabled.porter) return DeliveryProviderType.PORTER;
  if (enabled.delhivery) return DeliveryProviderType.DELHIVERY;
  if (enabled.borzo) return DeliveryProviderType.BORZO;

  return DeliveryProviderType.SHADOWFAX;
}

export function useOwnFleetDispatch(config: ConfigService): boolean {
  return (
    flag(config, 'ENABLE_OWN_FLEET', false) &&
    resolvePrimaryProviderType(config) === DeliveryProviderType.OWN_FLEET
  );
}
