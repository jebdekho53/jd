import { Injectable } from '@nestjs/common';
import {
  Coupon,
  CouponType,
  PromotionOfferType,
  PromotionTarget,
  StorePromotion,
} from '@prisma/client';

/** Maximum combined promo discount as % of subtotal */
export const MAX_COMBINED_DISCOUNT_PCT = 50;

export interface PromoCartItem {
  productId: string;
  variantId: string;
  categoryId: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PromoBreakdown {
  catalogSavings: number;
  offerDiscount: number;
  couponDiscount: number;
  deliveryDiscount: number;
  totalSavings: number;
  cashbackAmount: number;
  rewardPointsBonus: number;
  appliedCoupon: { id: string; code: string; name: string } | null;
  appliedPromotion: { id: string; name: string; offerType: PromotionOfferType } | null;
  appliedOffer: { id: string; name: string; kind: string } | null;
  appliedOffers: Array<{ id: string; name: string; kind: string }>;
  freeDelivery: boolean;
}

export interface EnrichedTotals {
  subtotal: number;
  discount: number;
  catalogSavings: number;
  offerDiscount: number;
  couponDiscount: number;
  deliveryDiscount: number;
  totalSavings: number;
  tax: number;
  deliveryFee: number;
  grandTotal: number;
  promo: PromoBreakdown;
}

@Injectable()
export class PromotionPricingService {
  computeTotals(input: {
    items: PromoCartItem[];
    catalogSavings: number;
    baseDeliveryFee: number;
    coupon: Coupon | null;
    promotion: StorePromotion | null;
  }): EnrichedTotals {
    const subtotal = input.items.reduce((s, i) => s + i.lineTotal, 0);
    const eligibleSubtotal = this.eligibleSubtotal(input.items, input.promotion);

    let offerDiscount = 0;
    let deliveryDiscount = 0;
    let freeDelivery = false;

    if (input.promotion && eligibleSubtotal >= Number(input.promotion.minOrderAmount)) {
      const promoResult = this.computePromotionDiscount(
        input.promotion,
        input.items,
        eligibleSubtotal,
        input.baseDeliveryFee,
      );
      offerDiscount = promoResult.discount;
      if (promoResult.freeDelivery) {
        freeDelivery = true;
        deliveryDiscount = input.baseDeliveryFee;
      }
    }

    let couponDiscount = 0;
    if (input.coupon) {
      const couponResult = this.computeCouponDiscount(
        input.coupon,
        subtotal,
        input.baseDeliveryFee,
        freeDelivery,
      );
      couponDiscount = couponResult.discount;
      if (couponResult.freeDelivery && !freeDelivery) {
        freeDelivery = true;
        deliveryDiscount = input.baseDeliveryFee;
      }
    }

    const rawPromoTotal = offerDiscount + couponDiscount;
    const maxAllowed = Math.round(subtotal * (MAX_COMBINED_DISCOUNT_PCT / 100) * 100) / 100;
    if (rawPromoTotal > maxAllowed && rawPromoTotal > 0) {
      const ratio = maxAllowed / rawPromoTotal;
      offerDiscount = Math.round(offerDiscount * ratio * 100) / 100;
      couponDiscount = Math.round(couponDiscount * ratio * 100) / 100;
    }

    const deliveryFee = freeDelivery ? 0 : input.baseDeliveryFee;
    const tax = 0;
    const grandTotal = Math.max(0, subtotal - offerDiscount - couponDiscount + deliveryFee + tax);
    const totalSavings =
      input.catalogSavings + offerDiscount + couponDiscount + deliveryDiscount;

    return {
      subtotal,
      discount: input.catalogSavings,
      catalogSavings: input.catalogSavings,
      offerDiscount,
      couponDiscount,
      deliveryDiscount,
      totalSavings,
      tax,
      deliveryFee,
      grandTotal,
      promo: {
        catalogSavings: input.catalogSavings,
        offerDiscount,
        couponDiscount,
        deliveryDiscount,
        totalSavings,
        appliedCoupon: input.coupon
          ? { id: input.coupon.id, code: input.coupon.code, name: input.coupon.name }
          : null,
        appliedPromotion: input.promotion
          ? {
              id: input.promotion.id,
              name: input.promotion.name,
              offerType: input.promotion.offerType,
            }
          : null,
        appliedOffer: null,
        appliedOffers: [],
        cashbackAmount: 0,
        rewardPointsBonus: 0,
        freeDelivery,
      },
    };
  }

  computeTotalsWithOfferExtras(input: {
    items: PromoCartItem[];
    catalogSavings: number;
    baseDeliveryFee: number;
    coupon: Coupon | null;
    promotion: StorePromotion | null;
    offerDiscountOverride?: number;
    cashbackAmount?: number;
    rewardPointsBonus?: number;
    appliedOffer?: { id: string; name: string; kind: string } | null;
    appliedOffers?: Array<{ id: string; name: string; kind: string }>;
  }): EnrichedTotals {
    const base = this.computeTotals({
      items: input.items,
      catalogSavings: input.catalogSavings,
      baseDeliveryFee: input.baseDeliveryFee,
      coupon: input.coupon,
      promotion: input.promotion,
    });

    if (input.offerDiscountOverride != null && input.appliedOffer) {
      const subtotal = input.items.reduce((s, i) => s + i.lineTotal, 0);
      const offerDiscount = input.offerDiscountOverride;
      const maxAllowed = Math.round(subtotal * (MAX_COMBINED_DISCOUNT_PCT / 100) * 100) / 100;
      const cappedOffer = Math.min(offerDiscount, maxAllowed);
      const deliveryFee = base.promo.freeDelivery ? 0 : input.baseDeliveryFee;
      const grandTotal = Math.max(
        0,
        subtotal - cappedOffer - base.couponDiscount + deliveryFee + base.tax,
      );
      const cashback = input.cashbackAmount ?? 0;
      const points = input.rewardPointsBonus ?? 0;

      return {
        ...base,
        offerDiscount: cappedOffer,
        grandTotal,
        totalSavings: input.catalogSavings + cappedOffer + base.couponDiscount + base.deliveryDiscount,
        promo: {
          ...base.promo,
          offerDiscount: cappedOffer,
          cashbackAmount: cashback,
          rewardPointsBonus: points,
          appliedOffer: input.appliedOffer,
          appliedOffers: input.appliedOffers ?? [],
        },
      };
    }

    return {
      ...base,
      promo: {
        ...base.promo,
        cashbackAmount: input.cashbackAmount ?? 0,
        rewardPointsBonus: input.rewardPointsBonus ?? 0,
        appliedOffer: input.appliedOffer ?? null,
        appliedOffers: input.appliedOffers ?? [],
      },
    };
  }

  computePromotionBenefit(
    promo: StorePromotion,
    items: PromoCartItem[],
    subtotal: number,
    deliveryFee: number,
  ): { discount: number; freeDelivery: boolean } {
    const eligible = this.eligibleSubtotal(items, promo);
    if (eligible < Number(promo.minOrderAmount)) {
      return { discount: 0, freeDelivery: false };
    }
    return this.computePromotionDiscount(promo, items, eligible, deliveryFee);
  }

  pickBestPromotion(
    promotions: StorePromotion[],
    items: PromoCartItem[],
    subtotal: number,
    deliveryFee: number,
  ): StorePromotion | null {
    let best: { promo: StorePromotion; discount: number } | null = null;

    for (const promo of promotions) {
      const eligible = this.eligibleSubtotal(items, promo);
      if (eligible < Number(promo.minOrderAmount)) continue;
      const result = this.computePromotionDiscount(promo, items, eligible, deliveryFee);
      const score = result.discount + (result.freeDelivery ? deliveryFee : 0);
      if (!best || score > best.discount) {
        best = { promo, discount: score };
      }
    }

    return best?.promo ?? null;
  }

  private eligibleSubtotal(items: PromoCartItem[], promo: StorePromotion | null): number {
    if (!promo) return 0;
    if (promo.target === PromotionTarget.STORE_WIDE) {
      return items.reduce((s, i) => s + i.lineTotal, 0);
    }
    if (promo.target === PromotionTarget.CATEGORY && promo.categoryId) {
      return items
        .filter((i) => i.categoryId === promo.categoryId)
        .reduce((s, i) => s + i.lineTotal, 0);
    }
    if (promo.target === PromotionTarget.PRODUCT && promo.productId) {
      return items
        .filter((i) => i.productId === promo.productId)
        .reduce((s, i) => s + i.lineTotal, 0);
    }
    return 0;
  }

  private computePromotionDiscount(
    promo: StorePromotion,
    items: PromoCartItem[],
    eligibleSubtotal: number,
    deliveryFee: number,
  ): { discount: number; freeDelivery: boolean } {
    const value = Number(promo.discountValue);
    const maxDisc = promo.maxDiscount ? Number(promo.maxDiscount) : undefined;

    switch (promo.offerType) {
      case PromotionOfferType.FREE_DELIVERY:
        return { discount: 0, freeDelivery: true };

      case PromotionOfferType.PERCENTAGE_DISCOUNT:
      case PromotionOfferType.COMBO: {
        let d = (eligibleSubtotal * value) / 100;
        if (maxDisc != null) d = Math.min(d, maxDisc);
        return { discount: Math.round(d * 100) / 100, freeDelivery: false };
      }

      case PromotionOfferType.FLAT_DISCOUNT: {
        let d = Math.min(value, eligibleSubtotal);
        if (maxDisc != null) d = Math.min(d, maxDisc);
        return { discount: Math.round(d * 100) / 100, freeDelivery: false };
      }

      case PromotionOfferType.BUY_X_GET_Y: {
        const buy = promo.buyQuantity ?? 2;
        const get = promo.getQuantity ?? 1;
        const targetItems =
          promo.target === PromotionTarget.PRODUCT && promo.productId
            ? items.filter((i) => i.productId === promo.productId)
            : promo.target === PromotionTarget.CATEGORY && promo.categoryId
              ? items.filter((i) => i.categoryId === promo.categoryId)
              : items;

        let discount = 0;
        for (const item of targetItems) {
          const unit = item.unitPrice;
          const sets = Math.floor(item.quantity / (buy + get));
          discount += sets * get * unit;
        }
        if (maxDisc != null) discount = Math.min(discount, maxDisc);
        return { discount: Math.round(discount * 100) / 100, freeDelivery: false };
      }

      default:
        return { discount: 0, freeDelivery: false };
    }
  }

  private computeCouponDiscount(
    coupon: Coupon,
    subtotal: number,
    deliveryFee: number,
    alreadyFreeDelivery: boolean,
  ): { discount: number; freeDelivery: boolean } {
    const value = Number(coupon.discountValue);
    const maxDisc = coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined;

    if (coupon.type === CouponType.FREE_DELIVERY) {
      return { discount: 0, freeDelivery: !alreadyFreeDelivery };
    }

    let discount = 0;
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (subtotal * value) / 100;
    } else if (coupon.type === CouponType.FIXED_AMOUNT) {
      discount = Math.min(value, subtotal);
    }

    if (maxDisc != null) discount = Math.min(discount, maxDisc);
    return { discount: Math.round(discount * 100) / 100, freeDelivery: false };
  }
}
