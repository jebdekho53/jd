import { Coupon, PromotionOfferType, StorePromotion } from '@prisma/client';
export declare const MAX_COMBINED_DISCOUNT_PCT = 50;
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
    appliedCoupon: {
        id: string;
        code: string;
        name: string;
    } | null;
    appliedPromotion: {
        id: string;
        name: string;
        offerType: PromotionOfferType;
    } | null;
    appliedOffer: {
        id: string;
        name: string;
        kind: string;
    } | null;
    appliedOffers: Array<{
        id: string;
        name: string;
        kind: string;
    }>;
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
export declare class PromotionPricingService {
    computeTotals(input: {
        items: PromoCartItem[];
        catalogSavings: number;
        baseDeliveryFee: number;
        coupon: Coupon | null;
        promotion: StorePromotion | null;
    }): EnrichedTotals;
    computeTotalsWithOfferExtras(input: {
        items: PromoCartItem[];
        catalogSavings: number;
        baseDeliveryFee: number;
        coupon: Coupon | null;
        promotion: StorePromotion | null;
        offerDiscountOverride?: number;
        cashbackAmount?: number;
        rewardPointsBonus?: number;
        appliedOffer?: {
            id: string;
            name: string;
            kind: string;
        } | null;
        appliedOffers?: Array<{
            id: string;
            name: string;
            kind: string;
        }>;
    }): EnrichedTotals;
    computePromotionBenefit(promo: StorePromotion, items: PromoCartItem[], subtotal: number, deliveryFee: number): {
        discount: number;
        freeDelivery: boolean;
    };
    pickBestPromotion(promotions: StorePromotion[], items: PromoCartItem[], subtotal: number, deliveryFee: number): StorePromotion | null;
    private eligibleSubtotal;
    private computePromotionDiscount;
    private computeCouponDiscount;
}
