import { resolveDeliveryPricing } from './delivery-pricing.util';

const FEE = 49;

describe('resolveDeliveryPricing', () => {
  it('SELF delivery is free to customer, no merchant contribution', () => {
    const r = resolveDeliveryPricing({ deliveryMode: 'SELF', subtotal: 1000, platformFee: FEE });
    expect(r).toEqual({
      deliveryMode: 'SELF',
      customerDeliveryFee: 0,
      merchantDeliveryContribution: 0,
      freeForCustomer: true,
    });
  });

  it('PLATFORM below threshold: customer pays the flat fee', () => {
    const r = resolveDeliveryPricing({
      deliveryMode: 'PLATFORM',
      subtotal: 300,
      freeDeliveryThreshold: 499,
      platformFee: FEE,
    });
    expect(r.customerDeliveryFee).toBe(49);
    expect(r.merchantDeliveryContribution).toBe(0);
    expect(r.freeForCustomer).toBe(false);
  });

  it('PLATFORM at/above threshold: free to customer, merchant absorbs the fee', () => {
    const r = resolveDeliveryPricing({
      deliveryMode: 'PLATFORM',
      subtotal: 600,
      freeDeliveryThreshold: 499,
      platformFee: FEE,
    });
    expect(r.customerDeliveryFee).toBe(0);
    expect(r.merchantDeliveryContribution).toBe(49);
    expect(r.freeForCustomer).toBe(true);
  });

  it('exactly at threshold counts as free', () => {
    const r = resolveDeliveryPricing({
      deliveryMode: 'PLATFORM',
      subtotal: 499,
      freeDeliveryThreshold: 499,
      platformFee: FEE,
    });
    expect(r.customerDeliveryFee).toBe(0);
    expect(r.merchantDeliveryContribution).toBe(49);
  });

  it('no threshold set: customer always pays the fee', () => {
    const r = resolveDeliveryPricing({
      deliveryMode: 'PLATFORM',
      subtotal: 5000,
      freeDeliveryThreshold: null,
      platformFee: FEE,
    });
    expect(r.customerDeliveryFee).toBe(49);
    expect(r.merchantDeliveryContribution).toBe(0);
  });

  it('platform never subsidises: customer fee + merchant contribution always covers the fee', () => {
    for (const subtotal of [0, 250, 499, 500, 2000]) {
      const r = resolveDeliveryPricing({
        deliveryMode: 'PLATFORM',
        subtotal,
        freeDeliveryThreshold: 499,
        platformFee: FEE,
      });
      expect(r.customerDeliveryFee + r.merchantDeliveryContribution).toBe(49);
    }
  });
});
