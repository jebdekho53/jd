import { DeliveryStatus, Prisma } from '@prisma/client';
export declare const MAX_ACTIVE_DELIVERIES = 1;
export declare const ASSIGNMENT_OFFER_SECONDS = 30;
export declare function unassignedOrderWhere(): Prisma.OrderWhereInput;
export declare function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number;
export declare function minutesSince(date: Date | string): number;
export declare function isActiveDeliveryStatus(status: DeliveryStatus): boolean;
export declare function activeDeliveryStatuses(): DeliveryStatus[];
export interface ScoredRider {
    id: string;
    activeDeliveries: number;
    distanceKm: number;
    idleMins: number;
    inZone: boolean;
    score: number;
}
export declare function scoreRider(input: {
    inZone: boolean;
    activeDeliveries: number;
    distanceKm: number;
    idleMins: number;
}): number;
