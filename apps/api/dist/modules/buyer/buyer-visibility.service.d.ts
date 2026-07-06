import { BuyerLocationContext, isProductVisible, isStoreVisible, StoreEligibilityResult } from './buyer-visibility.util';
import type { DeliverableStoreWithCoverage } from '../../common/utils/delivery-coverage.util';
export declare class BuyerVisibilityService {
    readonly storeVisibleWhere: Prisma.StoreWhereInput;
    readonly productVisibleWhere: Prisma.ProductWhereInput;
    readonly storeDiscoveryInclude: Prisma.StoreInclude;
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
