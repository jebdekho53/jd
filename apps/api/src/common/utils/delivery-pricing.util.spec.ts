import { resolveDeliveryPricing } from './delivery-pricing.util';

describe('resolveDeliveryPricing (money path)', () => {
  it('SELF delivery is always free to the customer, merchant pays nothing', () => {
    const r = resolveDeliveryPricing({
      deliveryMode: 'SELF',
      subtotal: 100,
      freeDeliveryThreshold: 500,
      platformFee: 46,
    });
    expect(r).toEqual({
      deliveryMode: 'SELF',
      customerDeliveryFee: 0,
      merchantDeliveryContribution: 0,
      freeForCustomer: true,
    });
  });

  it('PLATFORM below threshold → customer pays the flat fee', () => {
    const r = resolveDeliveryPricing({
      deliveryMode: 'PLATFORM',
      subtotal: 200,
      freeDeliveryThreshold: 500,
      platformFee: 46,
    });
    expect(r.customerDeliveryFee).toBe(46);
    expect(r.merchantDeliveryContribution).toBe(0);
    expect(r.freeForCustomer).toBe(false);
  });

  it('PLATFORM at/above threshold → free for customer, merchant absorbs the fee', () => {
    const r = resolveDeliveryPricing({
      deliveryMode: 'PLATFORM',
      subtotal: 500,
      freeDeliveryThreshold: 500,
      platformFee: 46,
    });
    expect(r.customerDeliveryFee).toBe(0);
    expect(r.merchantDeliveryContribution).toBe(46);
    expect(r.freeForCustomer).toBe(true);
  });

  it('no free-delivery offer (null/0 threshold) → customer always pays', () => {
    for (const threshold of [null, undefined, 0]) {
      const r = resolveDeliveryPricing({
        deliveryMode: 'PLATFORM',
        subtotal: 100000,
        freeDeliveryThreshold: threshold as number | null | undefined,
        platformFee: 46,
      });
      expect(r.customerDeliveryFee).toBe(46);
      expect(r.freeForCustomer).toBe(false);
    }
  });

  it('never charges a negative fee (platform never subsidises)', () => {
    const r = resolveDeliveryPricing({
      deliveryMode: 'PLATFORM',
      subtotal: 10,
      freeDeliveryThreshold: 500,
      platformFee: -100,
    });
    expect(r.customerDeliveryFee).toBe(0);
    expect(r.merchantDeliveryContribution).toBe(0);
  });
});
