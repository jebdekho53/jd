import { ConfigService } from '@nestjs/config';
import { DeliveryProviderType } from '@prisma/client';
export declare function resolvePrimaryProviderType(config: ConfigService): DeliveryProviderType;
export declare function useOwnFleetDispatch(config: ConfigService): boolean;
