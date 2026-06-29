import { DeliveryProviderType, StoreType } from '@prisma/client';
export declare function normalizeDeliveryPartnerLabel(provider?: string | null): string;
export declare function deliveryProviderTypeToKey(type: DeliveryProviderType): string;
export declare function deliveryProviderTypeToLabel(type: DeliveryProviderType): string;
export declare function resolveStoreDeliveryPartnerLabel(store: {
    storeType?: StoreType | null;
    preferredDeliveryProvider?: DeliveryProviderType | null;
}, platformProviderKey: string, ownFleetEnabled?: boolean): string;
