"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionPricingService = exports.MAX_COMBINED_DISCOUNT_PCT = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
exports.MAX_COMBINED_DISCOUNT_PCT = 50;
let PromotionPricingService = class PromotionPricingService {
    computeTotals(input) {
        const subtotal = input.items.reduce((s, i) => s + i.lineTotal, 0);
        const eligibleSubtotal = this.eligibleSubtotal(input.items, input.promotion);
        let offerDiscount = 0;
        let deliveryDiscount = 0;
        let freeDelivery = false;
        if (input.promotion && eligibleSubtotal >= Number(input.promotion.minOrderAmount)) {
            const promoResult = this.computePromotionDiscount(input.promotion, input.items, eligibleSubtotal, input.baseDeliveryFee);
            offerDiscount = promoResult.discount;
            if (promoResult.freeDelivery) {
                freeDelivery = true;
                deliveryDiscount = input.baseDeliveryFee;
            }
        }
        let couponDiscount = 0;
        if (input.coupon) {
            const couponResult = this.computeCouponDiscount(input.coupon, subtotal, input.baseDeliveryFee, freeDelivery);
            couponDiscount = couponResult.discount;
            if (couponResult.freeDelivery && !freeDelivery) {
                freeDelivery = true;
                deliveryDiscount = input.baseDeliveryFee;
            }
        }
        const rawPromoTotal = offerDiscount + couponDiscount;
        const maxAllowed = Math.round(subtotal * (exports.MAX_COMBINED_DISCOUNT_PCT / 100) * 100) / 100;
        if (rawPromoTotal > maxAllowed && rawPromoTotal > 0) {
            const ratio = maxAllowed / rawPromoTotal;
            offerDiscount = Math.round(offerDiscount * ratio * 100) / 100;
            couponDiscount = Math.round(couponDiscount * ratio * 100) / 100;
        }
        const deliveryFee = freeDelivery ? 0 : input.baseDeliveryFee;
        const tax = 0;
        const grandTotal = Math.max(0, subtotal - offerDiscount - couponDiscount + deliveryFee + tax);
        const totalSavings = input.catalogSavings + offerDiscount + couponDiscount + deliveryDiscount;
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
    computeTotalsWithOfferExtras(input) {
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
            const maxAllowed = Math.round(subtotal * (exports.MAX_COMBINED_DISCOUNT_PCT / 100) * 100) / 100;
            const cappedOffer = Math.min(offerDiscount, maxAllowed);
            const deliveryFee = base.promo.freeDelivery ? 0 : input.baseDeliveryFee;
            const grandTotal = Math.max(0, subtotal - cappedOffer - base.couponDiscount + deliveryFee + base.tax);
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
    computePromotionBenefit(promo, items, subtotal, deliveryFee) {
        const eligible = this.eligibleSubtotal(items, promo);
        if (eligible < Number(promo.minOrderAmount)) {
            return { discount: 0, freeDelivery: false };
        }
        return this.computePromotionDiscount(promo, items, eligible, deliveryFee);
    }
    pickBestPromotion(promotions, items, subtotal, deliveryFee) {
        let best = null;
        for (const promo of promotions) {
            const eligible = this.eligibleSubtotal(items, promo);
            if (eligible < Number(promo.minOrderAmount))
                continue;
            const result = this.computePromotionDiscount(promo, items, eligible, deliveryFee);
            const score = result.discount + (result.freeDelivery ? deliveryFee : 0);
            if (!best || score > best.discount) {
                best = { promo, discount: score };
            }
        }
        return best?.promo ?? null;
    }
    eligibleSubtotal(items, promo) {
        if (!promo)
            return 0;
        if (promo.target === client_1.PromotionTarget.STORE_WIDE) {
            return items.reduce((s, i) => s + i.lineTotal, 0);
        }
        if (promo.target === client_1.PromotionTarget.CATEGORY && promo.categoryId) {
            return items
                .filter((i) => i.categoryId === promo.categoryId)
                .reduce((s, i) => s + i.lineTotal, 0);
        }
        if (promo.target === client_1.PromotionTarget.PRODUCT && promo.productId) {
            return items
                .filter((i) => i.productId === promo.productId)
                .reduce((s, i) => s + i.lineTotal, 0);
        }
        return 0;
    }
    computePromotionDiscount(promo, items, eligibleSubtotal, deliveryFee) {
        const value = Number(promo.discountValue);
        const maxDisc = promo.maxDiscount ? Number(promo.maxDiscount) : undefined;
        switch (promo.offerType) {
            case client_1.PromotionOfferType.FREE_DELIVERY:
                return { discount: 0, freeDelivery: true };
            case client_1.PromotionOfferType.PERCENTAGE_DISCOUNT:
            case client_1.PromotionOfferType.COMBO: {
                let d = (eligibleSubtotal * value) / 100;
                if (maxDisc != null)
                    d = Math.min(d, maxDisc);
                return { discount: Math.round(d * 100) / 100, freeDelivery: false };
            }
            case client_1.PromotionOfferType.FLAT_DISCOUNT: {
                let d = Math.min(value, eligibleSubtotal);
                if (maxDisc != null)
                    d = Math.min(d, maxDisc);
                return { discount: Math.round(d * 100) / 100, freeDelivery: false };
            }
            case client_1.PromotionOfferType.BUY_X_GET_Y: {
                const buy = promo.buyQuantity ?? 2;
                const get = promo.getQuantity ?? 1;
                const targetItems = promo.target === client_1.PromotionTarget.PRODUCT && promo.productId
                    ? items.filter((i) => i.productId === promo.productId)
                    : promo.target === client_1.PromotionTarget.CATEGORY && promo.categoryId
                        ? items.filter((i) => i.categoryId === promo.categoryId)
                        : items;
                let discount = 0;
                for (const item of targetItems) {
                    const unit = item.unitPrice;
                    const sets = Math.floor(item.quantity / (buy + get));
                    discount += sets * get * unit;
                }
                if (maxDisc != null)
                    discount = Math.min(discount, maxDisc);
                return { discount: Math.round(discount * 100) / 100, freeDelivery: false };
            }
            default:
                return { discount: 0, freeDelivery: false };
        }
    }
    computeCouponDiscount(coupon, subtotal, deliveryFee, alreadyFreeDelivery) {
        const value = Number(coupon.discountValue);
        const maxDisc = coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined;
        if (coupon.type === client_1.CouponType.FREE_DELIVERY) {
            return { discount: 0, freeDelivery: !alreadyFreeDelivery };
        }
        let discount = 0;
        if (coupon.type === client_1.CouponType.PERCENTAGE) {
            discount = (subtotal * value) / 100;
        }
        else if (coupon.type === client_1.CouponType.FIXED_AMOUNT) {
            discount = Math.min(value, subtotal);
        }
        if (maxDisc != null)
            discount = Math.min(discount, maxDisc);
        return { discount: Math.round(discount * 100) / 100, freeDelivery: false };
    }
};
exports.PromotionPricingService = PromotionPricingService;
exports.PromotionPricingService = PromotionPricingService = __decorate([
    (0, common_1.Injectable)()
], PromotionPricingService);
//# sourceMappingURL=promotion-pricing.service.js.map