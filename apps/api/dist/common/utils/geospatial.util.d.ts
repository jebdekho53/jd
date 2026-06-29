export declare const ALLOWED_DELIVERY_RADII_KM: readonly [1, 3, 5, 8, 10];
export declare const DEFAULT_DELIVERY_RADIUS_KM = 5;
export type DeliveryRadiusKm = (typeof ALLOWED_DELIVERY_RADII_KM)[number];
export declare function normalizeDeliveryRadiusKm(value?: number | null): number;
export interface DeliverableStoreShape {
    latitude: number;
    longitude: number;
    deliveryRadiusKm?: number | null;
    storeServiceAreas: Array<{
        serviceArea: {
            centerLat: number;
            centerLng: number;
            radiusKm: number;
        };
    }>;
}
export interface DeliverabilityResult {
    deliverable: boolean;
    distanceKm: number | null;
    effectiveRadiusKm: number;
    reason?: string;
}
export declare function checkStoreDeliverability(buyerLat: number, buyerLng: number, store: DeliverableStoreShape): DeliverabilityResult;
export declare function trafficSpeedFactor(date?: Date): number;
export declare function estimateDeliveryEtaMins(distanceKm: number, prepTimeMins?: number, speedKmh?: number, trafficFactor?: number): number | null;
export declare function estimateStoreToBuyerEta(storeLat: number, storeLng: number, buyerLat: number, buyerLng: number, prepTimeMins: number, maxRadiusKm: number): number | null;
