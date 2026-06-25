import { rankAdAuction, computeCtr } from './ad-auction.util';

describe('KeywordAuctionService', () => {
  it('ranks higher bid with better quality and CTR', () => {
    const ranked = rankAdAuction(
      [
        { campaignId: 'a', bidAmount: 50, qualityScore: 0.8, ctr: 0.1, priority: 1 },
        { campaignId: 'b', bidAmount: 30, qualityScore: 0.9, ctr: 0.2, priority: 2 },
        { campaignId: 'c', bidAmount: 10, qualityScore: 0.5, ctr: 0.05, priority: 0 },
      ],
      3,
    );
    expect(ranked[0].campaignId).toBe('a');
    expect(ranked).toHaveLength(3);
  });

  it('limits sponsored slots to top 3', () => {
    const ranked = rankAdAuction(
      Array.from({ length: 5 }, (_, i) => ({
        campaignId: `c${i}`,
        bidAmount: 10 + i,
        qualityScore: 0.7,
        ctr: 0.1,
        priority: 0,
      })),
      3,
    );
    expect(ranked).toHaveLength(3);
  });

  it('computes CTR with floor for zero impressions', () => {
    expect(computeCtr(0, 0)).toBe(0.02);
    expect(computeCtr(5, 100)).toBe(0.05);
  });
});
