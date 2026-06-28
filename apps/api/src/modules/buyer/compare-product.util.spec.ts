import { buildCompareResult } from './compare-product.util';

describe('compare-product.util', () => {
  const anchor = { id: 'p1', name: 'Amul Taaza Milk', unit: '1L', imageUrls: ['https://x/img.jpg'] };

  const baseOffer = {
    storeId: 's1',
    storeName: 'Store A',
    storeSlug: 'a',
    productId: 'p1',
    variantId: 'v1',
    price: 60,
    offerPrice: 60,
    mrp: 65,
    discount: 5,
    discountPercent: 8,
    deliveryFee: 25,
    minimumOrder: 99,
    distanceKm: 1.2,
    etaMins: 25,
    rating: 4.5,
    stock: 10,
    finalPayableAmount: 85,
    serviceable: true,
    cheapest: false,
    deliveryPartner: 'Shadowfax',
  };

  it('sorts stores by final payable amount and flags cheapest', () => {
    const result = buildCompareResult(anchor, [
      { ...baseOffer },
      {
        ...baseOffer,
        storeId: 's2',
        storeName: 'Store B',
        storeSlug: 'b',
        offerPrice: 55,
        price: 55,
        deliveryFee: 20,
        finalPayableAmount: 75,
      },
    ]);
    expect(result?.bestPrice).toBe(75);
    expect(result?.savings).toBe(10);
    expect(result?.stores[0]?.storeName).toBe('Store B');
    expect(result?.stores[0]?.cheapest).toBe(true);
    expect(result?.stores[1]?.cheapest).toBe(false);
  });

  it('prefers serviceable in-stock offers when available', () => {
    const result = buildCompareResult(anchor, [
      { ...baseOffer, finalPayableAmount: 50, serviceable: false, stock: 0 },
      { ...baseOffer, storeId: 's2', finalPayableAmount: 80, serviceable: true, stock: 5 },
    ]);
    expect(result?.stores[0]?.storeId).toBe('s2');
  });
});
