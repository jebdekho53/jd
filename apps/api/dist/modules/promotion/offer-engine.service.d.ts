import { Offer, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PromotionPricingService, PromoCartItem, EnrichedTotals } from './promotion-pricing.service';
import { OfferCacheService } from './offer-cache.service';
import { OfferEvaluatorService } from './offer-evaluator.service';
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
export declare class OfferEngineService {
    private readonly prisma;
    private readonly pricing;
    private readonly evaluator;
    private readonly cache;
    constructor(prisma: PrismaService, pricing: PromotionPricingService, evaluator: OfferEvaluatorService, cache: OfferCacheService);
    evaluateCheckout(input: CheckoutEvaluateInput): Promise<EnrichedTotals>;
    redeemOffers(tx: Prisma.TransactionClient, orderId: string, buyerProfileId: string, offerId: string | null, discountApplied: number, cashbackApplied: number, rewardPointsGranted: number, gmvImpact: number): Promise<void>;
    getFlashSales(limit?: number): Promise<any>;
    getOffersNearYou(lat: number, lng: number, limit?: number): Promise<any>;
    getPersonalizedOffers(buyerProfileId: string, lat?: number, lng?: number, limit?: number): Promise<any>;
    private loadStoreOffers;
    private loadLegacyPromotions;
    private resolveStackMode;
    private pickOffers;
    private scoreOffer;
    private scoreLegacyPromotion;
    private offerToSyntheticPromotion;
    private mapKindToPromotionType;
    private buildContext;
    serializeOffer(o: Offer & {
        store?: unknown;
        product?: unknown;
    }): {
        id: any;
        campaignId: any;
        storeId: any;
        name: any;
        description: any;
        kind: any;
        target: any;
        discountValue: number;
        cashbackAmount: number | null;
        rewardPointsBonus: any;
        minOrderAmount: number;
        maxDiscount: number | null;
        flashQtyLimit: any;
        flashQtyRemaining: number | null;
        startsAt: any;
        expiresAt: any;
        badge: string;
        store: {} | null;
        product: {} | null;
    };
    offerBadge(o: Offer): string;
    private haversineKm;
}
