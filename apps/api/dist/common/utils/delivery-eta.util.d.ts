export declare const DEFAULT_RIDER_SPEED_KMH = 25;
export declare const MAX_DELIVERY_DISTANCE_KM = 100;
export declare const MAX_REASONABLE_ETA_MINS = 180;
export declare function isValidCoordinate(lat?: number | null, lng?: number | null): boolean;
export declare function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number;
export declare function safeDistanceKm(lat1?: number | null, lng1?: number | null, lat2?: number | null, lng2?: number | null): number | null;
export declare function minutesAtSpeedKm(km: number, speedKmh?: number, trafficFactor?: number): number;
export interface DeliveryEtaInput {
    orderStatus: string;
    deliveryStatus?: string | null;
    storeLat?: number | null;
    storeLng?: number | null;
    customerLat?: number | null;
    customerLng?: number | null;
    riderLat?: number | null;
    riderLng?: number | null;
    pickedUpAt?: Date | string | null;
    hasActiveAssignment?: boolean;
    deliveryRadiusKm?: number | null;
}
export interface DeliveryEtaResult {
    estimatedMins: number | null;
    liveTrackingAvailable: boolean;
    etaAvailable: boolean;
}
export declare function computeDeliveryEta(input: DeliveryEtaInput): DeliveryEtaResult;
export interface CoordinateAuditInput {
    orderId: string;
    orderNumber?: string;
    orderStatus?: string;
    storeLat?: number | null;
    storeLng?: number | null;
    customerLat?: number | null;
    customerLng?: number | null;
    riderLat?: number | null;
    riderLng?: number | null;
    deliveryDistanceKm?: number | null;
}
export declare function auditDeliveryCoordinates(input: CoordinateAuditInput): string[];
