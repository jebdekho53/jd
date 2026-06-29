import { AudienceType, LoyaltyTier, Offer, OfferRule } from '@prisma/client';
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
    offer: Offer & {
        rules: OfferRule[];
    };
    score: number;
    discountValue: number;
    freeDelivery: boolean;
    cashbackAmount: number;
    rewardPointsBonus: number;
}
export declare class OfferEvaluatorService {
    isOfferActive(offer: Offer, now?: Date): boolean;
    passesRules(offer: Offer & {
        rules: OfferRule[];
    }, ctx: EvaluatorContext): boolean;
    passesAudience(audienceType: AudienceType, config: Record<string, unknown>, ctx: EvaluatorContext): boolean;
    private evaluateRule;
    private isHappyHourNow;
    private isInTimeWindow;
    private haversineKm;
}
