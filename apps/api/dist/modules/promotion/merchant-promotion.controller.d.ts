import { RequestUser } from '../../common/types';
import { StorePromotionService } from './store-promotion.service';
import { CreateStorePromotionDto, ListPromotionsDto, UpdateStorePromotionDto } from './dto/promotion.dto';
export declare class MerchantPromotionController {
    private readonly service;
    constructor(service: StorePromotionService);
    overview(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            activePromotions: number;
            totalUsages: number;
            totalDiscountGiven: number;
            ordersInfluenced: number;
            topPromotion: {
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
            } | null;
        };
    }>;
    list(user: RequestUser, storeId: string, dto: ListPromotionsDto): Promise<{
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
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    create(user: RequestUser, storeId: string, dto: CreateStorePromotionDto): Promise<{
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
        };
    }>;
    update(user: RequestUser, storeId: string, id: string, dto: UpdateStorePromotionDto): Promise<{
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
        };
    }>;
    pause(user: RequestUser, storeId: string, id: string): Promise<{
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
        };
    }>;
    resume(user: RequestUser, storeId: string, id: string): Promise<{
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
        };
    }>;
    remove(user: RequestUser, storeId: string, id: string): Promise<{
        success: boolean;
        data: {
            deleted: boolean;
        };
    }>;
}
