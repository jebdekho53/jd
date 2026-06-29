import { RequestUser } from '../../common/types';
import { StorePromotionService } from './store-promotion.service';
import { CreateCouponDto, ListAdminPromotionsDto } from './dto/promotion.dto';
export declare class AdminPromotionController {
    private readonly service;
    constructor(service: StorePromotionService);
    list(dto: ListAdminPromotionsDto): Promise<{
        success: boolean;
        data: {
            promotions: {
                store: {
                    id: string;
                    name: string;
                    slug: string;
                };
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
            coupons: {
                store: {
                    id: string;
                    name: string;
                    slug: string;
                } | null;
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
        };
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    analytics(): Promise<{
        success: boolean;
        data: {
            platformSavings: number;
            couponRedemptions: number;
            promotionRedemptions: number;
            topCoupons: {
                id: string;
                name: string;
                code: string;
                usageLimit: number | null;
                usedCount: number;
            }[];
            abuseCandidates: number;
        };
    }>;
    createCampaign(user: RequestUser, dto: CreateCouponDto): Promise<{
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
        };
    }>;
    suspend(user: RequestUser, id: string): Promise<{
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
        };
    }>;
}
