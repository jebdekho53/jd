import { computeLaunchReadiness } from './expansion.util';

describe('ExpansionService readiness', () => {
  it('computeLaunchReadiness returns 0-100', () => {
    const score = computeLaunchReadiness({
      storeDensity: 0.5,
      riderSupply: 0.5,
      searchDemand: 0.5,
      population: 0.5,
      procurementCoverage: 0.5,
    });
    expect(score).toBe(50);
  });

  it('weights store density at 30%', () => {
    const base = computeLaunchReadiness({
      storeDensity: 0,
      riderSupply: 1,
      searchDemand: 1,
      population: 1,
      procurementCoverage: 1,
    });
    const withStores = computeLaunchReadiness({
      storeDensity: 1,
      riderSupply: 1,
      searchDemand: 1,
      population: 1,
      procurementCoverage: 1,
    });
    expect(withStores - base).toBe(30);
  });
});
