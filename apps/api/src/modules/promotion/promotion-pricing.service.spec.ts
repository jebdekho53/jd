import { Test, TestingModule } from '@nestjs/testing';
import { CouponType, PromotionOfferType, PromotionTarget } from '@prisma/client';
import { PromotionPricingService } from './promotion-pricing.service';

describe('PromotionPricingService', () => {
  let service: PromotionPricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromotionPricingService],
    }).compile();
    service = module.get(PromotionPricingService);
  });

  const items = [
    {
      productId: 'p1',
      variantId: 'v1',
      categoryId: 'c1',
      quantity: 2,
      unitPrice: 100,
      lineTotal: 200,
    },
  ];

  it('applies percentage store offer and coupon with cap', () => {
    const result = service.computeTotals({
      items,
      catalogSavings: 20,
      baseDeliveryFee: 30,
      coupon: {
        id: 'c1',
        code: 'FLAT50',
        name: 'Flat 50',
        type: CouponType.FIXED_AMOUNT,
        discountValue: 50,
        maxDiscount: null,
        minOrderAmount: 0,
      } as any,
      promotion: {
        id: 'p1',
        name: '10% off',
        offerType: PromotionOfferType.PERCENTAGE_DISCOUNT,
        target: PromotionTarget.STORE_WIDE,
        discountValue: 10,
        minOrderAmount: 0,
        maxDiscount: null,
        categoryId: null,
        productId: null,
        buyQuantity: null,
        getQuantity: null,
      } as any,
    });

    expect(result.offerDiscount).toBe(20);
    expect(result.couponDiscount).toBe(50);
    expect(result.grandTotal).toBe(200 - 20 - 50 + 30);
  });

  it('rejects stacking beyond max combined discount pct', () => {
    const result = service.computeTotals({
      items: [{ ...items[0], lineTotal: 100, unitPrice: 100, quantity: 1 }],
      catalogSavings: 0,
      baseDeliveryFee: 0,
      coupon: {
        id: 'c1',
        code: 'BIG',
        name: 'Big',
        type: CouponType.FIXED_AMOUNT,
        discountValue: 40,
        maxDiscount: null,
        minOrderAmount: 0,
      } as any,
      promotion: {
        id: 'p1',
        name: '40 off',
        offerType: PromotionOfferType.FLAT_DISCOUNT,
        target: PromotionTarget.STORE_WIDE,
        discountValue: 40,
        minOrderAmount: 0,
        maxDiscount: null,
        categoryId: null,
        productId: null,
        buyQuantity: null,
        getQuantity: null,
      } as any,
    });

    expect(result.offerDiscount + result.couponDiscount).toBeLessThanOrEqual(50);
  });

  it('picks best promotion by total savings', () => {
    const promos = [
      {
        id: 'a',
        name: '5%',
        offerType: PromotionOfferType.PERCENTAGE_DISCOUNT,
        target: PromotionTarget.STORE_WIDE,
        discountValue: 5,
        minOrderAmount: 0,
        maxDiscount: null,
        categoryId: null,
        productId: null,
        buyQuantity: null,
        getQuantity: null,
      },
      {
        id: 'b',
        name: 'Free delivery',
        offerType: PromotionOfferType.FREE_DELIVERY,
        target: PromotionTarget.STORE_WIDE,
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscount: null,
        categoryId: null,
        productId: null,
        buyQuantity: null,
        getQuantity: null,
      },
    ] as any[];

    const best = service.pickBestPromotion(promos, items, 200, 40);
    expect(best?.id).toBe('b');
  });
});
