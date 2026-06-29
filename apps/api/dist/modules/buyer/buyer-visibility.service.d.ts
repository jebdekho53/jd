import { BuyerLocationContext, isProductVisible, isStoreVisible, StoreEligibilityResult } from './buyer-visibility.util';
import type { DeliverableStoreWithCoverage } from '../../common/utils/delivery-coverage.util';
export declare class BuyerVisibilityService {
    readonly storeVisibleWhere: import("@prisma/client").Prisma.StoreWhereInput;
    readonly productVisibleWhere: import("@prisma/client").Prisma.ProductWhereInput;
    readonly storeDiscoveryInclude: {
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
    readonly defaultDiscoveryRadiusKm = 20;
    isStoreVisible: typeof isStoreVisible;
    isProductVisible: typeof isProductVisible;
    canDeliverToBuyer(store: DeliverableStoreWithCoverage, ctx: BuyerLocationContext): StoreEligibilityResult;
    resolveDeliveryTerms(store: DeliverableStoreWithCoverage, pincode?: string | null): {
        deliveryFee: number;
        minOrderAmount: number;
        estimatedMinutes: number;
    };
}
