export interface RoutingScoreInput {
    inventoryAvailability: number;
    etaMins: number;
    capacityLoadPct: number;
    deliverySuccessRate: number;
    fulfillmentCost: number;
}
export declare function computeRoutingScore(input: RoutingScoreInput): number;
export declare function estimateEtaMins(distanceKm: number, avgPrepTimeMins: number): number;
export declare const CAPACITY_OVERLOAD_THRESHOLD = 90;
