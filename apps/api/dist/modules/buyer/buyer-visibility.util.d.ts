import { Prisma, StoreStatus } from '@prisma/client';
import { DeliverableStoreWithCoverage } from '../../common/utils/delivery-coverage.util';
import type { DeliverabilityResult } from '../../common/utils/geospatial.util';
export declare const STORE_VISIBLE_WHERE: Prisma.StoreWhereInput;
export declare const PRODUCT_VISIBLE_WHERE: Prisma.ProductWhereInput;
export declare const STORE_DISCOVERY_INCLUDE: {
    hours: true;
    storeServiceAreas: {
        include: {
            serviceArea: {
                select: {
                    centerLat: true;
                    centerLng: true;
                    radiusKm: true;
                };
            };
        };
    };
    deliveryAreas: {
        where: {
            isActive: true;
        };
        select: {
            pincode: true;
            isActive: true;
            deliveryFee: true;
            minimumOrder: true;
            estimatedMinutes: true;
            priority: true;
        };
    };
};
export declare const DEFAULT_BUYER_DISCOVERY_RADIUS_KM = 20;
export declare const UNLIMITED_DISCOVERY_RADIUS_KM: number;
export interface BuyerLocationContext {
    lat: number;
    lng: number;
    pincode?: string | null;
    discoveryRadiusKm?: number;
}
export interface StoreEligibilityResult {
    eligible: boolean;
    deliverable: DeliverabilityResult;
    pincodeMatch: boolean;
    filterReason?: string;
}
export declare function isStoreVisible(store: {
    status: StoreStatus;
    isActive: boolean;
    deletedAt: Date | null;
}): boolean;
export declare function isProductVisible(product: {
    isActive: boolean;
    deletedAt: Date | null;
}, hasInStockVariant: boolean): boolean;
export declare function canDeliverToBuyer(store: DeliverableStoreWithCoverage, ctx: BuyerLocationContext): StoreEligibilityResult;
export declare function toDeliverableStoreShape(store: {
    latitude: number;
    longitude: number;
    deliveryRadiusKm?: number | null;
    storeServiceAreas?: DeliverableStoreWithCoverage['storeServiceAreas'];
    deliveryAreas?: DeliverableStoreWithCoverage['deliveryAreas'];
    deliveryFee?: unknown;
    minOrderAmount?: unknown;
    avgPrepTimeMins?: number;
}): DeliverableStoreWithCoverage;
export declare function resolveBuyerDeliveryTerms(store: DeliverableStoreWithCoverage, pincode?: string | null): {
    deliveryFee: number;
    minOrderAmount: number;
    estimatedMinutes: number;
};
