import { pctChange } from '../merchant-dashboard/merchant-dashboard.utils';

describe('AnalyticsAggregatorService helpers', () => {
  it('pctChange computes growth correctly', () => {
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(0, 100)).toBe(-100);
    expect(pctChange(50, 0)).toBe(100);
  });
});
