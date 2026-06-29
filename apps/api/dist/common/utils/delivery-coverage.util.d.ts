import { Prisma } from '@prisma/client';
import { DeliverabilityResult, DeliverableStoreShape } from './geospatial.util';
export type StoreDeliveryAreaShape = {
    pincode: string;
    isActive: boolean;
    deliveryFee?: Prisma.Decimal | number | null;
    minimumOrder?: Prisma.Decimal | number | null;
    estimatedMinutes?: number | null;
    priority?: number;
};
export type DeliverableStoreWithCoverage = DeliverableStoreShape & {
    deliveryAreas?: StoreDeliveryAreaShape[];
    minOrderAmount?: Prisma.Decimal | number;
    deliveryFee?: Prisma.Decimal | number;
    avgPrepTimeMins?: number;
};
export interface PincodeDeliverabilityOptions {
    buyerPincode?: string | null;
}
export declare function hasActiveDeliveryAreas(areas?: StoreDeliveryAreaShape[] | null): boolean;
export declare function findActiveDeliveryArea(areas: StoreDeliveryAreaShape[] | undefined | null, pincode: string): StoreDeliveryAreaShape | null;
export declare function storeServesPincode(store: DeliverableStoreWithCoverage, buyerPincode: string): boolean;
export declare function resolveDeliveryTerms(store: DeliverableStoreWithCoverage, buyerPincode?: string | null): {
    deliveryFee: number;
    minOrderAmount: number;
    estimatedMinutes: number;
};
export declare function checkStoreDeliverabilityWithCoverage(buyerLat: number, buyerLng: number, store: DeliverableStoreWithCoverage, options?: PincodeDeliverabilityOptions): DeliverabilityResult;
