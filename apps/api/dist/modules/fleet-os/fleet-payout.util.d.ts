export interface FleetPayoutInput {
    baseEarning: number;
    distanceKm: number;
    batchSize: number;
    optimized: boolean;
}
export interface FleetPayoutBreakdown {
    singleDeliveryPayout: number;
    batchBonus: number;
    distancePayout: number;
    efficiencyBonus: number;
    total: number;
}
export declare function computeFleetPayout(input: FleetPayoutInput): FleetPayoutBreakdown;
