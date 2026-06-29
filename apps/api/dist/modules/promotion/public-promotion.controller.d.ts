import { StorePromotionService } from './store-promotion.service';
import { OfferEngineService } from './offer-engine.service';
import { CampaignAnalyticsService } from './campaign-analytics.service';
import { TrackCampaignEventDto } from './dto/campaign.dto';
export declare class PublicPromotionController {
    private readonly promotions;
    private readonly offers;
    private readonly analytics;
    constructor(promotions: StorePromotionService, offers: OfferEngineService, analytics: CampaignAnalyticsService);
    topDeals(): Promise<{
        success: boolean;
        data: {
            store: {
                id: string;
                name: string;
                slug: string;
                logoUrl: string | null;
            };
            badge: string;
            id: string;
            storeId: string;
            name: string;
            description: string | null;
            offerType: import("@prisma/client").$Enums.PromotionOfferType;
            target: import("@prisma/client").$Enums.PromotionTarget;
            categoryId: string | null;
            productId: string | null;
            discountValue: number;
            buyQuantity: number | null;
            getQuantity: number | null;
            minOrderAmount: number;
            maxDiscount: number | null;
            usageLimit: number | null;
            usedCount: number;
            startsAt: string;
            expiresAt: string;
            isActive: boolean;
            pausedAt: string | null;
        }[];
    }>;
    trendingDeals(): Promise<{
        success: boolean;
        data: {
            store: {
                id: string;
                name: string;
                slug: string;
                logoUrl: string | null;
            };
            badge: string;
            id: string;
            storeId: string;
            name: string;
            description: string | null;
            offerType: import("@prisma/client").$Enums.PromotionOfferType;
            target: import("@prisma/client").$Enums.PromotionTarget;
            categoryId: string | null;
            productId: string | null;
            discountValue: number;
            buyQuantity: number | null;
            getQuantity: number | null;
            minOrderAmount: number;
            maxDiscount: number | null;
            usageLimit: number | null;
            usedCount: number;
            startsAt: string;
            expiresAt: string;
            isActive: boolean;
            pausedAt: string | null;
        }[];
    }>;
    freeDeliveryStores(): Promise<{
        success: boolean;
        data: {
            store: {
                id: string;
                name: string;
                deliveryFee: import("@prisma/client/runtime/library").Decimal;
                ratingAvg: number;
                slug: string;
                logoUrl: string | null;
            };
            promotion: {
                id: string;
                storeId: string;
                name: string;
                description: string | null;
                offerType: import("@prisma/client").$Enums.PromotionOfferType;
                target: import("@prisma/client").$Enums.PromotionTarget;
                categoryId: string | null;
                productId: string | null;
                discountValue: number;
                buyQuantity: number | null;
                getQuantity: number | null;
                minOrderAmount: number;
                maxDiscount: number | null;
                usageLimit: number | null;
                usedCount: number;
                startsAt: string;
                expiresAt: string;
                isActive: boolean;
                pausedAt: string | null;
            };
        }[];
    }>;
    storeOffers(slug: string): Promise<{
        success: boolean;
        data: {
            id: string;
            storeId: string;
            name: string;
            description: string | null;
            offerType: import("@prisma/client").$Enums.PromotionOfferType;
            target: import("@prisma/client").$Enums.PromotionTarget;
            categoryId: string | null;
            productId: string | null;
            discountValue: number;
            buyQuantity: number | null;
            getQuantity: number | null;
            minOrderAmount: number;
            maxDiscount: number | null;
            usageLimit: number | null;
            usedCount: number;
            startsAt: string;
            expiresAt: string;
            isActive: boolean;
            pausedAt: string | null;
        }[];
    }>;
    storeCoupons(slug: string): Promise<{
        success: boolean;
        data: {
            id: string;
            code: string;
            name: string;
            description: string | null;
            type: import("@prisma/client").$Enums.CouponType;
            kind: import("@prisma/client").$Enums.CouponKind;
            scope: import("@prisma/client").$Enums.CouponScope;
            sponsor: import("@prisma/client").$Enums.OfferSponsor;
            storeId: string | null;
            discountValue: number;
            maxDiscount: number | null;
            minOrderAmount: number;
            usageLimit: number | null;
            usedCount: number;
            perUserLimit: number;
            firstOrderOnly: boolean;
            startsAt: string;
            expiresAt: string;
            isActive: boolean;
            suspendedAt: string | null;
        }[];
    }>;
    flashSales(limit?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            campaignId: string;
            storeId: string | null;
            name: string;
            description: string | null;
            kind: import("@prisma/client").$Enums.OfferKind;
            target: import("@prisma/client").$Enums.PromotionTarget;
            discountValue: number;
            cashbackAmount: number | null;
            rewardPointsBonus: number | null;
            minOrderAmount: number;
            maxDiscount: number | null;
            flashQtyLimit: number | null;
            flashQtyRemaining: number | null;
            startsAt: string;
            expiresAt: string;
            badge: string;
            store: {} | null;
            product: {} | null;
        }[];
    }>;
    offersNearYou(lat: string, lng: string, limit?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            campaignId: string;
            storeId: string | null;
            name: string;
            description: string | null;
            kind: import("@prisma/client").$Enums.OfferKind;
            target: import("@prisma/client").$Enums.PromotionTarget;
            discountValue: number;
            cashbackAmount: number | null;
            rewardPointsBonus: number | null;
            minOrderAmount: number;
            maxDiscount: number | null;
            flashQtyLimit: number | null;
            flashQtyRemaining: number | null;
            startsAt: string;
            expiresAt: string;
            badge: string;
            store: {} | null;
            product: {} | null;
        }[];
    }>;
    trackEvent(dto: TrackCampaignEventDto): Promise<{
        success: boolean;
    }>;
}
