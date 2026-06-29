export interface DemandForecastInput {
    orderQty7d: number;
    orderQty30d: number;
    searchHits7d: number;
    cartAdds7d: number;
    campaignBoost: number;
}
export interface DemandForecastResult {
    predictedDemand: number;
    confidenceScore: number;
}
export declare function predictDemand(input: DemandForecastInput, horizonDays: number): DemandForecastResult;
