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

/** Rank ads: highest bid × quality × CTR boost, capped at maxSlots */
export function rankAdAuction(candidates: AuctionCandidate[], maxSlots = 3): RankedAd[] {
  const scored = candidates.map((c) => {
    const ctrBoost = 1 + Math.min(0.5, c.ctr);
    const quality = Math.max(0.1, Math.min(1, c.qualityScore));
    const auctionScore = c.bidAmount * quality * ctrBoost + c.priority * 0.01;
    return { ...c, auctionScore };
  });
  return scored.sort((a, b) => b.auctionScore - a.auctionScore).slice(0, maxSlots);
}

export function computeCtr(clicks: number, impressions: number): number {
  if (impressions <= 0) return 0.02;
  return Math.min(1, clicks / impressions);
}

export function computeRoas(revenue: number, spend: number): number {
  if (spend <= 0) return 0;
  return Math.round((revenue / spend) * 100) / 100;
}
