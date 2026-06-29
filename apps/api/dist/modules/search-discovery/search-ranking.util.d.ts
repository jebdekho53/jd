export interface RankingSignals {
    relevance: number;
    distanceKm: number | null;
    maxDistanceKm: number;
    availableQty: number;
    maxQtyInPool: number;
    ratingAvg: number;
    avgPrepTimeMins: number;
    hasActiveOffer: boolean;
    isFlashSale?: boolean;
    campaignConversion?: number;
}
export declare const RANKING_WEIGHTS: {
    readonly relevance: 0.4;
    readonly distance: 0.2;
    readonly inventory: 0.15;
    readonly rating: 0.1;
    readonly deliverySpeed: 0.1;
    readonly offer: 0.05;
};
export declare function normalizeRelevance(raw: number): number;
export declare function normalizeDistance(distanceKm: number | null, maxKm: number): number;
export declare function normalizeInventory(qty: number, maxInPool: number): number;
export declare function normalizeRating(ratingAvg: number): number;
export declare function normalizeDeliverySpeed(avgPrepTimeMins: number): number;
export declare function computeHyperlocalScore(signals: RankingSignals): number;
export declare function textRelevanceScore(fields: {
    name: string;
    brand: string | null;
    tags: string[];
    description: string | null;
}, rawQuery: string): number;
export declare function estimateDeliveryEtaMins(distanceKm: number, avgPrepTimeMins: number): number;
