import { Injectable } from '@nestjs/common';
import {
  Offer,
  OfferKind,
  OfferStackMode,
  Prisma,
  PromotionOfferType,
  PromotionTarget,
  StorePromotion,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  MAX_COMBINED_DISCOUNT_PCT,
  PromotionPricingService,
  PromoCartItem,
  EnrichedTotals,
} from './promotion-pricing.service';
import { OfferCacheService } from './offer-cache.service';
import { EvaluatedOffer, EvaluatorContext, OfferEvaluatorService } from './offer-evaluator.service';

export interface CheckoutEvaluateInput {
  cartId: string;
  storeId: string;
  buyerProfileId: string;
  baseDeliveryFee: number;
  catalogSavings: number;
  items: PromoCartItem[];
  appliedCouponId: string | null;
  appliedPromotionId: string | null;
  appliedOfferId: string | null;
  lat?: number;
  lng?: number;
}

@Injectable()
export class OfferEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PromotionPricingService,
    private readonly evaluator: OfferEvaluatorService,
    private readonly cache: OfferCacheService,
  ) {}

  async evaluateCheckout(input: CheckoutEvaluateInput): Promise<EnrichedTotals> {
    const now = new Date();
    const subtotal = input.items.reduce((s, i) => s + i.lineTotal, 0);
    const ctx = await this.buildContext(input.buyerProfileId, subtotal, input.lat, input.lng);

    const [campaignOffers, legacyPromos] = await Promise.all([
      this.loadStoreOffers(input.storeId),
      this.loadLegacyPromotions(input.storeId, now),
    ]);

    const eligibleCampaign = campaignOffers
      .filter((o) => this.evaluator.isOfferActive(o, now))
      .filter((o) => this.evaluator.passesRules(o, ctx));

    const evaluatedCampaign = eligibleCampaign.map((o) =>
      this.scoreOffer(o, input.items, subtotal, input.baseDeliveryFee),
    );

    const evaluatedLegacy = legacyPromos.map((p) =>
      this.scoreLegacyPromotion(p, input.items, subtotal, input.baseDeliveryFee),
    );

    const stackMode = await this.resolveStackMode(input.storeId, campaignOffers);
    const selected = this.pickOffers(evaluatedCampaign, evaluatedLegacy, stackMode);

    let promotion: StorePromotion | null = null;
    let primaryOffer: (Offer & { rules: import('@prisma/client').OfferRule[] }) | null = null;
    let cashbackAmount = 0;
    let rewardPointsBonus = 0;
    let offerDiscount = 0;
    let freeDelivery = false;

    if (selected.length > 0) {
      for (const sel of selected) {
        if ('offer' in sel) {
          const ev = sel as EvaluatedOffer;
          offerDiscount += ev.discountValue;
          if (ev.freeDelivery) freeDelivery = true;
          cashbackAmount += ev.cashbackAmount;
          rewardPointsBonus += ev.rewardPointsBonus;
          if (!primaryOffer) primaryOffer = ev.offer;
        } else {
          const leg = sel as { promo: StorePromotion; discountValue: number; freeDelivery: boolean };
          offerDiscount += leg.discountValue;
          if (leg.freeDelivery) freeDelivery = true;
          if (!promotion) promotion = leg.promo;
        }
      }

      offerDiscount = Math.round(offerDiscount * 100) / 100;
      const maxAllowed = Math.round(subtotal * (MAX_COMBINED_DISCOUNT_PCT / 100) * 100) / 100;
      if (offerDiscount > maxAllowed) offerDiscount = maxAllowed;

      if (primaryOffer) {
        await this.prisma.cart.update({
          where: { id: input.cartId },
          data: {
            appliedOfferId: primaryOffer.id,
            appliedPromotionId: promotion?.id ?? null,
          },
        });
      } else if (promotion) {
        await this.prisma.cart.update({
          where: { id: input.cartId },
          data: { appliedPromotionId: promotion.id, appliedOfferId: null },
        });
      }
    }

    const syntheticPromo = primaryOffer
      ? this.offerToSyntheticPromotion(primaryOffer, offerDiscount, freeDelivery)
      : promotion;

    let coupon = input.appliedCouponId
      ? await this.prisma.coupon.findUnique({ where: { id: input.appliedCouponId } })
      : null;
    if (coupon && (!coupon.isActive || coupon.suspendedAt || now > coupon.expiresAt)) {
      coupon = null;
      await this.prisma.cart.update({ where: { id: input.cartId }, data: { appliedCouponId: null } });
    }

    const totals = await this.pricing.computeTotalsWithOfferExtras({
      items: input.items,
      catalogSavings: input.catalogSavings,
      baseDeliveryFee: input.baseDeliveryFee,
      coupon,
      promotion: syntheticPromo,
      offerDiscountOverride: primaryOffer ? offerDiscount : undefined,
      cashbackAmount,
      rewardPointsBonus,
      appliedOffer: primaryOffer
        ? { id: primaryOffer.id, name: primaryOffer.name, kind: primaryOffer.kind }
        : null,
      appliedOffers: selected
        .filter((s): s is EvaluatedOffer => 'offer' in s)
        .map((s) => ({ id: s.offer.id, name: s.offer.name, kind: s.offer.kind })),
    });

    return totals;
  }

  async redeemOffers(
    tx: Prisma.TransactionClient,
    orderId: string,
    buyerProfileId: string,
    offerId: string | null,
    discountApplied: number,
    cashbackApplied: number,
    rewardPointsGranted: number,
    gmvImpact: number,
  ): Promise<void> {
    if (!offerId) return;

    const offer = await tx.offer.findUnique({ where: { id: offerId } });
    if (!offer) return;

    const usageWhere: Prisma.OfferWhereInput = {
      id: offerId,
      ...(offer.usageLimit != null ? { usedCount: { lt: offer.usageLimit } } : {}),
      ...(offer.kind === OfferKind.FLASH_SALE && offer.flashQtyLimit != null
        ? { flashQtySold: { lt: offer.flashQtyLimit } }
        : {}),
    };

    const updated = await tx.offer.updateMany({
      where: usageWhere as Prisma.OfferWhereInput,
      data: {
        usedCount: { increment: 1 },
        ...(offer.kind === OfferKind.FLASH_SALE ? { flashQtySold: { increment: 1 } } : {}),
      },
    });

    if (updated.count === 0) return;

    await tx.offerUsage.create({
      data: {
        offerId,
        orderId,
        buyerProfileId,
        discountApplied,
        cashbackApplied,
        rewardPointsGranted,
        gmvImpact,
      },
    });

    await tx.campaign.update({
      where: { id: offer.campaignId },
      data: {
        orderCount: { increment: 1 },
        gmvGenerated: { increment: gmvImpact },
        spentAmount: { increment: discountApplied + cashbackApplied },
      },
    });

    await tx.campaignEvent.create({
      data: {
        campaignId: offer.campaignId,
        offerId,
        eventType: 'REDEMPTION',
        buyerProfileId,
        storeId: offer.storeId,
      },
    });
  }

  async getFlashSales(limit = 12) {
    return this.cache.wrap(this.cache.flashSalesKey(), async () => {
      const now = new Date();
      const offers = await this.prisma.offer.findMany({
        where: {
          kind: OfferKind.FLASH_SALE,
          isActive: true,
          pausedAt: null,
          startsAt: { lte: now },
          expiresAt: { gte: now },
        },
        include: {
          store: { select: { id: true, name: true, slug: true, logoUrl: true } },
          product: { select: { id: true, name: true, slug: true, imageUrls: true, basePrice: true } },
        },
        orderBy: { expiresAt: 'asc' },
        take: limit,
      });
      return offers
        .filter((o) => !o.flashQtyLimit || o.flashQtySold < o.flashQtyLimit)
        .map((o) => this.serializeOffer(o));
    });
  }

  async getOffersNearYou(lat: number, lng: number, limit = 12) {
    const offers = await this.prisma.offer.findMany({
      where: {
        isActive: true,
        pausedAt: null,
        startsAt: { lte: new Date() },
        expiresAt: { gte: new Date() },
        kind: { in: [OfferKind.LOCALITY_BASED, OfferKind.STORE_WIDE_DISCOUNT, OfferKind.PERCENTAGE_DISCOUNT] },
      },
      include: {
        store: { select: { id: true, name: true, slug: true, logoUrl: true, latitude: true, longitude: true } },
        rules: true,
      },
      take: 50,
    });

    const nearby = offers.filter((o) => {
      if (!o.store?.latitude || !o.store?.longitude) return true;
      const dist = this.haversineKm(lat, lng, Number(o.store.latitude), Number(o.store.longitude));
      return dist <= 15;
    });

    return nearby.slice(0, limit).map((o) => this.serializeOffer(o));
  }

  async getPersonalizedOffers(buyerProfileId: string, lat?: number, lng?: number, limit = 10) {
    return this.cache.wrap(
      this.cache.personalizedKey(buyerProfileId, lat, lng),
      async () => {
        const ctx = await this.buildContext(buyerProfileId, 0, lat, lng);
        const offers = await this.prisma.offer.findMany({
          where: {
            isActive: true,
            pausedAt: null,
            expiresAt: { gte: new Date() },
          },
          include: { store: { select: { id: true, name: true, slug: true, logoUrl: true } }, rules: true },
          orderBy: [{ priority: 'desc' }, { usedCount: 'desc' }],
          take: 40,
        });

        return offers
          .filter((o) => this.evaluator.isOfferActive(o))
          .filter((o) => this.evaluator.passesRules(o, ctx))
          .slice(0, limit)
          .map((o) => this.serializeOffer(o));
      },
    );
  }

  private async loadStoreOffers(storeId: string) {
    return this.cache.wrap(this.cache.storeOffersKey(storeId), () =>
      this.prisma.offer.findMany({
        where: {
          OR: [{ storeId }, { storeId: null, campaign: { scope: 'PLATFORM' } }],
          isActive: true,
          campaign: { status: { in: ['ACTIVE', 'SCHEDULED'] } },
        },
        include: { rules: true, campaign: { select: { stackMode: true, status: true } } },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  }

  private async loadLegacyPromotions(storeId: string, now: Date) {
    const promos = await this.prisma.storePromotion.findMany({
      where: {
        storeId,
        isActive: true,
        pausedAt: null,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
    });
    return promos.filter((p) => !p.usageLimit || p.usedCount < p.usageLimit);
  }

  private async resolveStackMode(
    storeId: string,
    offers: Array<{ campaign: { stackMode: OfferStackMode } }>,
  ): Promise<OfferStackMode> {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        OR: [{ storeId }, { scope: 'PLATFORM' }],
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });
    if (campaign) return campaign.stackMode;
    const fromOffer = offers[0]?.campaign?.stackMode;
    return fromOffer ?? OfferStackMode.BEST_OFFER;
  }

  private pickOffers(
    campaign: EvaluatedOffer[],
    legacy: Array<{ promo: StorePromotion; discountValue: number; freeDelivery: boolean; score: number }>,
    mode: OfferStackMode,
  ): Array<EvaluatedOffer | { promo: StorePromotion; discountValue: number; freeDelivery: boolean }> {
    const legacyAsEval = legacy.map((l) => ({ ...l, kind: 'legacy' as const }));
    const all = [
      ...campaign.map((c) => ({ type: 'campaign' as const, score: c.score, item: c })),
      ...legacyAsEval.map((l) => ({ type: 'legacy' as const, score: l.score, item: l })),
    ].sort((a, b) => b.score - a.score);

    if (all.length === 0) return [];

    if (mode === OfferStackMode.BEST_OFFER) {
      const best = all[0];
      if (best.type === 'campaign') return [best.item as EvaluatedOffer];
      const leg = best.item as (typeof legacy)[0];
      return [{ promo: leg.promo, discountValue: leg.discountValue, freeDelivery: leg.freeDelivery }];
    }

    const stack: Array<EvaluatedOffer | { promo: StorePromotion; discountValue: number; freeDelivery: boolean }> = [];
    for (const entry of all.slice(0, 3)) {
      if (entry.type === 'campaign') stack.push(entry.item as EvaluatedOffer);
      else {
        const leg = entry.item as (typeof legacy)[0];
        stack.push({ promo: leg.promo, discountValue: leg.discountValue, freeDelivery: leg.freeDelivery });
      }
    }
    return stack;
  }

  private scoreOffer(
    offer: Offer & { rules: import('@prisma/client').OfferRule[] },
    items: PromoCartItem[],
    subtotal: number,
    deliveryFee: number,
  ): EvaluatedOffer {
    const virtual = this.offerToSyntheticPromotion(offer, 0, false);
    const result = this.pricing.computePromotionBenefit(virtual, items, subtotal, deliveryFee);
    const cashback = offer.kind === OfferKind.WALLET_CASHBACK
      ? Number(offer.cashbackAmount ?? offer.discountValue)
      : 0;
    const points = offer.kind === OfferKind.REWARD_POINT_BONUS
      ? (offer.rewardPointsBonus ?? Math.floor(Number(offer.discountValue)))
      : 0;
    const score = result.discount + (result.freeDelivery ? deliveryFee : 0) + cashback + points * 0.1;
    return {
      offer,
      score,
      discountValue: result.discount,
      freeDelivery: result.freeDelivery || offer.kind === OfferKind.FREE_DELIVERY,
      cashbackAmount: cashback,
      rewardPointsBonus: points,
    };
  }

  private scoreLegacyPromotion(
    promo: StorePromotion,
    items: PromoCartItem[],
    subtotal: number,
    deliveryFee: number,
  ) {
    const result = this.pricing.computePromotionBenefit(promo, items, subtotal, deliveryFee);
    return {
      promo,
      discountValue: result.discount,
      freeDelivery: result.freeDelivery,
      score: result.discount + (result.freeDelivery ? deliveryFee : 0),
    };
  }

  private offerToSyntheticPromotion(
    offer: Offer,
    flatOverride?: number,
    freeDelivery?: boolean,
  ): StorePromotion {
    const offerType = this.mapKindToPromotionType(offer.kind);
    return {
      id: offer.id,
      storeId: offer.storeId ?? '',
      name: offer.name,
      description: offer.description,
      offerType: freeDelivery ? PromotionOfferType.FREE_DELIVERY : offerType,
      target: offer.target,
      categoryId: offer.categoryId,
      productId: offer.productId,
      discountValue: flatOverride != null ? flatOverride : offer.discountValue,
      buyQuantity: offer.buyQuantity,
      getQuantity: offer.getQuantity,
      minOrderAmount: offer.minOrderAmount,
      maxDiscount: offer.maxDiscount,
      usageLimit: offer.usageLimit,
      usedCount: offer.usedCount,
      startsAt: offer.startsAt,
      expiresAt: offer.expiresAt,
      isActive: offer.isActive,
      pausedAt: offer.pausedAt,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    } as StorePromotion;
  }

  private mapKindToPromotionType(kind: OfferKind): PromotionOfferType {
    switch (kind) {
      case OfferKind.FLAT_DISCOUNT:
      case OfferKind.WALLET_CASHBACK:
        return PromotionOfferType.FLAT_DISCOUNT;
      case OfferKind.BUY_X_GET_Y:
        return PromotionOfferType.BUY_X_GET_Y;
      case OfferKind.COMBO_BUNDLE:
        return PromotionOfferType.COMBO;
      case OfferKind.FREE_DELIVERY:
        return PromotionOfferType.FREE_DELIVERY;
      default:
        return PromotionOfferType.PERCENTAGE_DISCOUNT;
    }
  }

  private async buildContext(
    buyerProfileId: string,
    subtotal: number,
    lat?: number,
    lng?: number,
  ): Promise<EvaluatorContext> {
    const [orderCount, wallet, usages, recentOrders] = await Promise.all([
      this.prisma.order.count({
        where: { buyerProfileId, status: { in: ['DELIVERED', 'COMPLETED'] } },
      }),
      this.prisma.buyerWallet.findUnique({ where: { buyerProfileId } }),
      this.prisma.offerUsage.groupBy({
        by: ['offerId'],
        where: { buyerProfileId },
        _count: { id: true },
      }),
      this.prisma.order.findMany({
        where: { buyerProfileId },
        include: { items: { select: { product: { select: { categoryId: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const perUserUsage = new Map(usages.map((u) => [u.offerId, u._count.id]));
    const favoriteCategoryIds = [
      ...new Set(
        recentOrders.flatMap((o) =>
          o.items.map((i) => i.product.categoryId).filter((c): c is string => c != null),
        ),
      ),
    ];

    return {
      buyerProfileId,
      subtotal,
      lat,
      lng,
      completedOrderCount: orderCount,
      walletTier: wallet?.tier ?? 'BRONZE',
      perUserUsage,
      favoriteCategoryIds,
      hasReferralCode: Boolean(wallet?.referredById),
    };
  }

  serializeOffer(o: Offer & { store?: unknown; product?: unknown }) {
    const remaining =
      o.flashQtyLimit != null ? Math.max(0, o.flashQtyLimit - o.flashQtySold) : null;
    return {
      id: o.id,
      campaignId: o.campaignId,
      storeId: o.storeId,
      name: o.name,
      description: o.description,
      kind: o.kind,
      target: o.target,
      discountValue: Number(o.discountValue),
      cashbackAmount: o.cashbackAmount ? Number(o.cashbackAmount) : null,
      rewardPointsBonus: o.rewardPointsBonus,
      minOrderAmount: Number(o.minOrderAmount),
      maxDiscount: o.maxDiscount ? Number(o.maxDiscount) : null,
      flashQtyLimit: o.flashQtyLimit,
      flashQtyRemaining: remaining,
      startsAt: o.startsAt.toISOString(),
      expiresAt: o.expiresAt.toISOString(),
      badge: this.offerBadge(o),
      store: (o as { store?: unknown }).store ?? null,
      product: (o as { product?: unknown }).product ?? null,
    };
  }

  offerBadge(o: Offer): string {
    switch (o.kind) {
      case OfferKind.FREE_DELIVERY:
        return 'Free delivery';
      case OfferKind.FLASH_SALE:
        return 'Flash sale';
      case OfferKind.HAPPY_HOUR:
        return 'Happy hour';
      case OfferKind.FLAT_DISCOUNT:
        return `₹${Number(o.discountValue)} off`;
      case OfferKind.WALLET_CASHBACK:
        return `₹${Number(o.cashbackAmount ?? o.discountValue)} cashback`;
      default:
        return `${Number(o.discountValue)}% off`;
    }
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
