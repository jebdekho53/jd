import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryProviderType } from '@prisma/client';
import type { ILogisticsProvider } from './interfaces/logistics-provider.interface';
import { ProviderNotEnabledError } from './errors/logistics.errors';
import { resolvePrimaryProviderType } from './utils/logistics-config.util';
import { ShadowfaxProvider } from './providers/shadowfax/shadowfax.provider';
import { PorterProvider, DelhiveryProvider, BorzoProvider } from './providers/stub/stub-providers';
import { OwnFleetProvider } from './providers/own-fleet/own-fleet.provider';

@Injectable()
export class LogisticsProviderRegistry {
  private readonly providers: Map<DeliveryProviderType, ILogisticsProvider>;

  constructor(
    config: ConfigService,
    shadowfax: ShadowfaxProvider,
    porter: PorterProvider,
    delhivery: DelhiveryProvider,
    borzo: BorzoProvider,
    ownFleet: OwnFleetProvider,
  ) {
    this.providers = new Map<DeliveryProviderType, ILogisticsProvider>([
      [DeliveryProviderType.SHADOWFAX, shadowfax],
      [DeliveryProviderType.PORTER, porter],
      [DeliveryProviderType.DELHIVERY, delhivery],
      [DeliveryProviderType.BORZO, borzo],
      [DeliveryProviderType.OWN_FLEET, ownFleet],
    ]);
    this.primaryType = resolvePrimaryProviderType(config);
  }

  readonly primaryType: DeliveryProviderType;

  get(type: DeliveryProviderType): ILogisticsProvider {
    const provider = this.providers.get(type);
    if (!provider) throw new ProviderNotEnabledError(type);
    return provider;
  }

  getPrimary(): ILogisticsProvider {
    return this.get(this.primaryType);
  }

  listRegistered(): DeliveryProviderType[] {
    return [...this.providers.keys()];
  }
}
