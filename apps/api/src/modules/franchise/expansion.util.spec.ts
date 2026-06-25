import { computeFranchiseShare, computeLaunchReadiness, pincodeSetsOverlap } from './expansion.util';

describe('Territory overlap detection', () => {
  it('detects overlapping pincodes', () => {
    const overlap = pincodeSetsOverlap(['110016', '110017'], ['110017', '110018']);
    expect(overlap).toEqual(['110017']);
  });

  it('returns empty when no overlap', () => {
    expect(pincodeSetsOverlap(['110016'], ['110020'])).toEqual([]);
  });
});

describe('Launch readiness scoring', () => {
  it('scores high when all factors strong', () => {
    const score = computeLaunchReadiness({
      storeDensity: 0.9,
      riderSupply: 0.8,
      searchDemand: 0.7,
      population: 0.8,
      procurementCoverage: 0.6,
    });
    expect(score).toBeGreaterThanOrEqual(75);
  });

  it('scores low with weak procurement', () => {
    const strong = computeLaunchReadiness({
      storeDensity: 0.8,
      riderSupply: 0.8,
      searchDemand: 0.8,
      population: 0.8,
      procurementCoverage: 0.8,
    });
    const weak = computeLaunchReadiness({
      storeDensity: 0.8,
      riderSupply: 0.8,
      searchDemand: 0.8,
      population: 0.8,
      procurementCoverage: 0.1,
    });
    expect(strong).toBeGreaterThan(weak);
  });
});

describe('Franchise settlement calculations', () => {
  it('splits GMV by commission percent', () => {
    const { franchiseShare, platformShare } = computeFranchiseShare(100000, 5);
    expect(franchiseShare).toBe(5000);
    expect(platformShare).toBe(95000);
  });
});
