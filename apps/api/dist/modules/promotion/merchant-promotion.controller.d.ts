import { RequestUser } from '../../common/types';
import { StorePromotionService } from './store-promotion.service';
import { CreateStorePromotionDto, ListPromotionsDto, UpdateStorePromotionDto } from './dto/promotion.dto';
export declare class MerchantPromotionController {
    private readonly service;
    constructor(service: StorePromotionService);
    overview(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            activePromotions: any;
            totalUsages: any;
            totalDiscountGiven: number;
            ordersInfluenced: any;
            topPromotion: {
                id: any;
                storeId: any;
                name: any;
                description: any;
                offerType: any;
                target: any;
                categoryId: any;
                productId: any;
                discountValue: number;
                buyQuantity: any;
                getQuantity: any;
                minOrderAmount: number;
                maxDiscount: number | null;
                usageLimit: any;
                usedCount: any;
                startsAt: any;
                expiresAt: any;
                isActive: any;
                pausedAt: any;
            } | null;
        };
    }>;
    list(user: RequestUser, storeId: string, dto: ListPromotionsDto): Promise<{
        success: boolean;
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
        };
    }>;
    create(user: RequestUser, storeId: string, dto: CreateStorePromotionDto): Promise<{
        success: boolean;
        data: {
            id: any;
            storeId: any;
            name: any;
            description: any;
            offerType: any;
            target: any;
            categoryId: any;
            productId: any;
            discountValue: number;
            buyQuantity: any;
            getQuantity: any;
            minOrderAmount: number;
            maxDiscount: number | null;
            usageLimit: any;
            usedCount: any;
            startsAt: any;
            expiresAt: any;
            isActive: any;
            pausedAt: any;
        };
    }>;
    update(user: RequestUser, storeId: string, id: string, dto: UpdateStorePromotionDto): Promise<{
        success: boolean;
        data: {
            id: any;
            storeId: any;
            name: any;
            description: any;
            offerType: any;
            target: any;
            categoryId: any;
            productId: any;
            discountValue: number;
            buyQuantity: any;
            getQuantity: any;
            minOrderAmount: number;
            maxDiscount: number | null;
            usageLimit: any;
            usedCount: any;
            startsAt: any;
            expiresAt: any;
            isActive: any;
            pausedAt: any;
        };
    }>;
    pause(user: RequestUser, storeId: string, id: string): Promise<{
        success: boolean;
        data: {
            id: any;
            storeId: any;
            name: any;
            description: any;
            offerType: any;
            target: any;
            categoryId: any;
            productId: any;
            discountValue: number;
            buyQuantity: any;
            getQuantity: any;
            minOrderAmount: number;
            maxDiscount: number | null;
            usageLimit: any;
            usedCount: any;
            startsAt: any;
            expiresAt: any;
            isActive: any;
            pausedAt: any;
        };
    }>;
    resume(user: RequestUser, storeId: string, id: string): Promise<{
        success: boolean;
        data: {
            id: any;
            storeId: any;
            name: any;
            description: any;
            offerType: any;
            target: any;
            categoryId: any;
            productId: any;
            discountValue: number;
            buyQuantity: any;
            getQuantity: any;
            minOrderAmount: number;
            maxDiscount: number | null;
            usageLimit: any;
            usedCount: any;
            startsAt: any;
            expiresAt: any;
            isActive: any;
            pausedAt: any;
        };
    }>;
    remove(user: RequestUser, storeId: string, id: string): Promise<{
        success: boolean;
        data: {
            deleted: boolean;
        };
    }>;
}
