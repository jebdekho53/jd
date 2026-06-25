import { predictStockout } from './inventory-forecast.util';

describe('InventoryForecastService', () => {
  it('predicts critical stockout when velocity exceeds stock', () => {
    const result = predictStockout({
      availableQty: 5,
      soldQty30d: 60,
      leadTimeDays: 2,
    });
    expect(result.daysUntilStockout).toBeLessThanOrEqual(3);
    expect(result.urgency).toBe('CRITICAL');
    expect(result.recommendedQty).toBeGreaterThan(0);
  });

  it('predicts low urgency with ample stock', () => {
    const result = predictStockout({
      availableQty: 500,
      soldQty30d: 30,
      leadTimeDays: 2,
    });
    expect(result.urgency).toBe('LOW');
    expect(result.recommendedQty).toBe(0);
  });
});
