import { computeRoutingScore, estimateEtaMins } from './smart-fulfillment.util';

describe('Smart fulfillment routing score', () => {
  it('prefers high inventory and low ETA (lower score wins)', () => {
    const wellStocked = computeRoutingScore({
      inventoryAvailability: 1,
      etaMins: 12,
      capacityLoadPct: 40,
      deliverySuccessRate: 0.95,
      fulfillmentCost: 20,
    });
    const outOfStock = computeRoutingScore({
      inventoryAvailability: 0,
      etaMins: 18,
      capacityLoadPct: 40,
      deliverySuccessRate: 0.95,
      fulfillmentCost: 20,
    });
    expect(wellStocked).toBeLessThan(outOfStock);
  });

  it('selects dark store with better ETA when inventory equal', () => {
    const darkStore = computeRoutingScore({
      inventoryAvailability: 1,
      etaMins: 12,
      capacityLoadPct: 50,
      deliverySuccessRate: 0.9,
      fulfillmentCost: 15,
    });
    const retailStore = computeRoutingScore({
      inventoryAvailability: 1,
      etaMins: 18,
      capacityLoadPct: 50,
      deliverySuccessRate: 0.9,
      fulfillmentCost: 15,
    });
    expect(darkStore).toBeLessThan(retailStore);
  });

  it('estimates ETA from distance and prep time', () => {
    expect(estimateEtaMins(5, 10)).toBeGreaterThan(10);
  });
});
