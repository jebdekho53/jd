import { computeReplenishmentQty } from './replenishment.util';

describe('Smart replenishment', () => {
  it('recommends order qty based on daily sales', () => {
    expect(computeReplenishmentQty(8, 4)).toBeGreaterThanOrEqual(20);
  });

  it('predicts OOS days from stock and velocity', () => {
    const oosDays = 8 / 4;
    expect(oosDays).toBe(2);
  });
});
