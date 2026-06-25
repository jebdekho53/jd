import {
  computeHyperlocalScore,
  normalizeDistance,
  normalizeInventory,
  normalizeRating,
  normalizeRelevance,
  textRelevanceScore,
} from './search-ranking.util';

describe('search-ranking.util', () => {
  it('ranks nearby in-stock highly-rated stores above distant ones', () => {
    const near = computeHyperlocalScore({
      relevance: 100,
      distanceKm: 1,
      maxDistanceKm: 10,
      availableQty: 20,
      maxQtyInPool: 20,
      ratingAvg: 4.8,
      avgPrepTimeMins: 12,
      hasActiveOffer: true,
    });
    const far = computeHyperlocalScore({
      relevance: 100,
      distanceKm: 9,
      maxDistanceKm: 10,
      availableQty: 2,
      maxQtyInPool: 20,
      ratingAvg: 3.5,
      avgPrepTimeMins: 35,
      hasActiveOffer: false,
    });
    expect(near).toBeGreaterThan(far);
  });

  it('textRelevanceScore prefers exact name matches', () => {
    const exact = textRelevanceScore(
      { name: 'Protein Bar', brand: null, tags: [], description: null },
      'protein bar',
    );
    const partial = textRelevanceScore(
      { name: 'Energy Drink', brand: 'Protein Co', tags: [], description: null },
      'protein bar',
    );
    expect(exact).toBeGreaterThan(partial);
  });

  it('normalizers stay within 0-1', () => {
    expect(normalizeRelevance(200)).toBe(1);
    expect(normalizeDistance(0, 10)).toBe(1);
    expect(normalizeInventory(5, 10)).toBe(0.5);
    expect(normalizeRating(5)).toBe(1);
  });
});
