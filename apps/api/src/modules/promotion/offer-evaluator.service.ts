import { Injectable } from '@nestjs/common';
import {
  AudienceType,
  LoyaltyTier,
  Offer,
  OfferKind,
  OfferRule,
  OfferRuleType,
} from '@prisma/client';

export interface EvaluatorContext {
  buyerProfileId: string;
  subtotal: number;
  lat?: number;
  lng?: number;
  completedOrderCount: number;
  walletTier: LoyaltyTier;
  perUserUsage: Map<string, number>;
  favoriteCategoryIds: string[];
  hasReferralCode: boolean;
}

export interface EvaluatedOffer {
  offer: Offer & { rules: OfferRule[] };
  score: number;
  discountValue: number;
  freeDelivery: boolean;
  cashbackAmount: number;
  rewardPointsBonus: number;
}

@Injectable()
export class OfferEvaluatorService {
  isOfferActive(offer: Offer, now = new Date()): boolean {
    if (!offer.isActive || offer.pausedAt) return false;
    if (now < offer.startsAt || now > offer.expiresAt) return false;
    if (offer.usageLimit != null && offer.usedCount >= offer.usageLimit) return false;
    if (offer.kind === OfferKind.FLASH_SALE && offer.flashQtyLimit != null) {
      if (offer.flashQtySold >= offer.flashQtyLimit) return false;
    }
    return true;
  }

  passesRules(
    offer: Offer & { rules: OfferRule[] },
    ctx: EvaluatorContext,
  ): boolean {
    if (Number(offer.minOrderAmount) > ctx.subtotal) return false;

    const userUsage = ctx.perUserUsage.get(offer.id) ?? 0;
    if (userUsage >= offer.perUserLimit) return false;

    if (offer.kind === OfferKind.FIRST_ORDER && ctx.completedOrderCount > 0) {
      return false;
    }

    for (const rule of offer.rules) {
      if (!this.evaluateRule(rule, offer, ctx)) return false;
    }

    if (offer.kind === OfferKind.HAPPY_HOUR) {
      const happyRule = offer.rules.find((r) => r.ruleType === OfferRuleType.HAPPY_HOUR);
      if (happyRule && !this.evaluateRule(happyRule, offer, ctx)) return false;
      if (!happyRule && !this.isHappyHourNow()) return false;
    }

    if (offer.kind === OfferKind.LOCALITY_BASED) {
      const locRule = offer.rules.find((r) => r.ruleType === OfferRuleType.LOCALITY);
      if (locRule && !this.evaluateRule(locRule, offer, ctx)) return false;
    }

    if (offer.kind === OfferKind.REFERRAL_CAMPAIGN && !ctx.hasReferralCode) {
      return false;
    }

    return true;
  }

  passesAudience(
    audienceType: AudienceType,
    config: Record<string, unknown>,
    ctx: EvaluatorContext,
  ): boolean {
    switch (audienceType) {
      case AudienceType.ALL:
        return true;
      case AudienceType.NEW_USERS:
        return ctx.completedOrderCount === 0;
      case AudienceType.WALLET_TIER: {
        const tiers = (config.tiers as string[]) ?? [];
        return tiers.length === 0 || tiers.includes(ctx.walletTier);
      }
      case AudienceType.LOCALITY: {
        if (ctx.lat == null || ctx.lng == null) return false;
        const center = config.center as { lat: number; lng: number } | undefined;
        const radiusKm = Number(config.radiusKm ?? 5);
        if (!center) return true;
        return this.haversineKm(ctx.lat, ctx.lng, center.lat, center.lng) <= radiusKm;
      }
      case AudienceType.CATEGORY_AFFINITY: {
        const cats = (config.categoryIds as string[]) ?? [];
        return cats.some((c) => ctx.favoriteCategoryIds.includes(c));
      }
      case AudienceType.SEARCH_HISTORY:
        return true;
      default:
        return true;
    }
  }

  private evaluateRule(
    rule: OfferRule,
    offer: Offer,
    ctx: EvaluatorContext,
  ): boolean {
    const config = rule.config as Record<string, unknown>;
    switch (rule.ruleType) {
      case OfferRuleType.HAPPY_HOUR:
        return this.isInTimeWindow(config);
      case OfferRuleType.LOCALITY: {
        if (ctx.lat == null || ctx.lng == null) return false;
        const center = config.center as { lat: number; lng: number };
        const radiusKm = Number(config.radiusKm ?? 3);
        return this.haversineKm(ctx.lat, ctx.lng, center.lat, center.lng) <= radiusKm;
      }
      case OfferRuleType.FIRST_ORDER:
        return ctx.completedOrderCount === 0;
      case OfferRuleType.WALLET_TIER: {
        const tiers = (config.tiers as string[]) ?? [];
        return tiers.includes(ctx.walletTier);
      }
      case OfferRuleType.MIN_ORDER:
        return ctx.subtotal >= Number(config.minAmount ?? offer.minOrderAmount);
      case OfferRuleType.FLASH_INVENTORY:
        return offer.flashQtyLimit == null || offer.flashQtySold < offer.flashQtyLimit;
      case OfferRuleType.REFERRAL:
        return ctx.hasReferralCode;
      case OfferRuleType.CATEGORY_AFFINITY: {
        const cats = (config.categoryIds as string[]) ?? [];
        return cats.some((c) => ctx.favoriteCategoryIds.includes(c));
      }
      default:
        return true;
    }
  }

  private isHappyHourNow(): boolean {
    const hour = new Date().getHours();
    return hour >= 14 && hour < 17;
  }

  private isInTimeWindow(config: Record<string, unknown>): boolean {
    const startHour = Number(config.startHour ?? 14);
    const endHour = Number(config.endHour ?? 17);
    const hour = new Date().getHours();
    if (startHour <= endHour) return hour >= startHour && hour < endHour;
    return hour >= startHour || hour < endHour;
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
