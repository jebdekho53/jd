export interface AuctionCandidate {
    campaignId: string;
    productId?: string;
    storeId?: string;
    bidAmount: number;
    qualityScore: number;
    ctr: number;
    priority: number;
}
export interface RankedAd extends AuctionCandidate {
    auctionScore: number;
}
export declare function rankAdAuction(candidates: AuctionCandidate[], maxSlots?: number): RankedAd[];
export declare function computeCtr(clicks: number, impressions: number): number;
export declare function computeRoas(revenue: number, spend: number): number;
