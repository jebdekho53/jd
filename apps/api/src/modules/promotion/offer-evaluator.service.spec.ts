import { OfferEvaluatorService } from './offer-evaluator.service';
import { OfferKind, OfferRuleType, LoyaltyTier } from '@prisma/client';

describe('OfferEvaluatorService', () => {
  const svc = new OfferEvaluatorService();

  const baseOffer = {
    id: 'o1',
    campaignId: 'c1',
    storeId: 's1',
    name: 'Test',
    description: null,
    kind: OfferKind.PERCENTAGE_DISCOUNT,
    target: 'STORE_WIDE' as const,
    categoryId: null,
    productId: null,
    variantId: null,
    discountValue: 10,
    cashbackAmount: null,
    rewardPointsBonus: null,
    buyQuantity: null,
    getQuantity: null,
    minOrderAmount: 100,
    maxDiscount: null,
    usageLimit: null,
    usedCount: 0,
    perUserLimit: 1,
    flashQtyLimit: null,
    flashQtySold: 0,
    startsAt: new Date(Date.now() - 86400000),
    expiresAt: new Date(Date.now() + 86400000),
    isActive: true,
    pausedAt: null,
    priority: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    rules: [],
  };

  const ctx = {
    buyerProfileId: 'bp1',
    subtotal: 500,
    completedOrderCount: 0,
    walletTier: LoyaltyTier.BRONZE,
    perUserUsage: new Map<string, number>(),
    favoriteCategoryIds: ['cat1'],
    hasReferralCode: false,
  };

  it('rejects offer below min order', () => {
    expect(svc.passesRules(baseOffer as never, { ...ctx, subtotal: 50 })).toBe(false);
  });

  it('passes first-order offer for new buyer', () => {
    const offer = { ...baseOffer, kind: OfferKind.FIRST_ORDER };
    expect(svc.passesRules(offer as never, ctx)).toBe(true);
    expect(svc.passesRules(offer as never, { ...ctx, completedOrderCount: 2 })).toBe(false);
  });

  it('evaluates happy hour rule', () => {
    const offer = {
      ...baseOffer,
      kind: OfferKind.HAPPY_HOUR,
      rules: [
        {
          id: 'r1',
          offerId: 'o1',
          ruleType: OfferRuleType.HAPPY_HOUR,
          config: { startHour: 0, endHour: 24 },
        },
      ],
    };
    expect(svc.passesRules(offer as never, ctx)).toBe(true);
  });
});
