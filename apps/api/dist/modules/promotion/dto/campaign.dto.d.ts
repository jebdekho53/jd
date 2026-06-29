import { AudienceType, CampaignEventType, CampaignScope, CampaignStatus, OfferKind, OfferRuleType, OfferStackMode, PromotionTarget } from '@prisma/client';
export declare class OfferRuleDto {
    ruleType: OfferRuleType;
    config: Record<string, unknown>;
}
export declare class CampaignAudienceDto {
    audienceType: AudienceType;
    config: Record<string, unknown>;
}
export declare class CreateOfferDto {
    name: string;
    description?: string;
    kind: OfferKind;
    target?: PromotionTarget;
    storeId?: string;
    categoryId?: string;
    productId?: string;
    variantId?: string;
    discountValue: number;
    cashbackAmount?: number;
    rewardPointsBonus?: number;
    buyQuantity?: number;
    getQuantity?: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    flashQtyLimit?: number;
    startsAt: string;
    expiresAt: string;
    priority?: number;
    rules?: OfferRuleDto[];
}
export declare class CreateCampaignDto {
    name: string;
    description?: string;
    stackMode?: OfferStackMode;
    startsAt: string;
    endsAt: string;
    budgetCap?: number;
    audiences?: CampaignAudienceDto[];
    offers?: CreateOfferDto[];
}
export declare class UpdateCampaignDto {
    name?: string;
    description?: string;
    stackMode?: OfferStackMode;
    startsAt?: string;
    endsAt?: string;
    budgetCap?: number;
}
export declare class ListCampaignsDto {
    scope?: CampaignScope;
    status?: CampaignStatus;
    storeId?: string;
    q?: string;
    page?: number;
    limit?: number;
}
export declare class TrackCampaignEventDto {
    campaignId: string;
    offerId?: string;
    eventType: CampaignEventType;
}
