import { PromotionPricingService } from './promotion-pricing.service';
import { OfferEvaluatorService } from './offer-evaluator.service';
import { OfferEngineService } from './offer-engine.service';
import { OfferCacheService } from './offer-cache.service';
import { OfferKind, PromotionOfferType, PromotionTarget } from '@prisma/client';

describe('OfferEngineService', () => {
  const pricing = new PromotionPricingService();
  const evaluator = new OfferEvaluatorService();
  const cache = {
    wrap: jest.fn((_k: string, fn: () => Promise<unknown>) => fn()),
    storeOffersKey: (id: string) => `offers:store:${id}`,
    flashSalesKey: () => 'offers:flash:active',
    personalizedKey: () => 'offers:personalized',
  } as unknown as OfferCacheService;

  const prisma = {
    offer: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
    storePromotion: { findMany: jest.fn().mockResolvedValue([]) },
    campaign: { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn() },
    cart: { update: jest.fn() },
    coupon: { findUnique: jest.fn().mockResolvedValue(null) },
    order: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
    buyerWallet: { findUnique: jest.fn().mockResolvedValue({ tier: 'BRONZE', referredById: null }) },
    offerUsage: { groupBy: jest.fn().mockResolvedValue([]), create: jest.fn() },
    campaignEvent: { create: jest.fn() },
  };

  const engine = new OfferEngineService(prisma as never, pricing, evaluator, cache);

  it('offerBadge formats flash sale', () => {
    const badge = engine.offerBadge({
      kind: OfferKind.FLASH_SALE,
      discountValue: 20,
      cashbackAmount: null,
    } as never);
    expect(badge).toBe('Flash sale');
  });

  it('computePromotionBenefit via pricing for percentage offer', () => {
    const promo = {
      offerType: PromotionOfferType.PERCENTAGE_DISCOUNT,
      target: PromotionTarget.STORE_WIDE,
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscount: null,
      categoryId: null,
      productId: null,
      buyQuantity: null,
      getQuantity: null,
    };
    const result = pricing.computePromotionBenefit(
      promo as never,
      [{ productId: 'p1', variantId: 'v1', categoryId: null, quantity: 2, unitPrice: 100, lineTotal: 200 }],
      200,
      30,
    );
    expect(result.discount).toBe(20);
  });
});
