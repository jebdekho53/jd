import { ConfigService } from '@nestjs/config';
import { DeliveryProviderType } from '@prisma/client';
import type { ILogisticsProvider } from './interfaces/logistics-provider.interface';
import { ShadowfaxProvider } from './providers/shadowfax/shadowfax.provider';
import { PorterProvider, DelhiveryProvider, BorzoProvider } from './providers/stub/stub-providers';
import { OwnFleetProvider } from './providers/own-fleet/own-fleet.provider';
export declare class LogisticsProviderRegistry {
    private readonly providers;
    constructor(config: ConfigService, shadowfax: ShadowfaxProvider, porter: PorterProvider, delhivery: DelhiveryProvider, borzo: BorzoProvider, ownFleet: OwnFleetProvider);
    readonly primaryType: DeliveryProviderType;
    get(type: DeliveryProviderType): ILogisticsProvider;
    getPrimary(): ILogisticsProvider;
    listRegistered(): DeliveryProviderType[];
}
