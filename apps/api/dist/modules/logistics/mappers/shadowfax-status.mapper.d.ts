import { DeliveryStatus, ShipmentProviderStatus } from '@prisma/client';
export declare function mapShadowfaxStatus(raw: string | undefined | null): ShipmentProviderStatus;
export declare function normalizedToDeliveryStatus(status: ShipmentProviderStatus): DeliveryStatus;
export declare function shadowfaxStatusTable(): Array<{
    provider: string;
    normalized: ShipmentProviderStatus;
}>;
