import { RequestUser } from '../../common/types';
import { StorePromotionService } from './store-promotion.service';
import { CreateCouponDto, ListAdminPromotionsDto } from './dto/promotion.dto';
export declare class AdminPromotionController {
    private readonly service;
    constructor(service: StorePromotionService);
    list(dto: ListAdminPromotionsDto): Promise<{
        success: boolean;
        data: {
            promotions: any;
            coupons: any;
        };
        meta: {
            page: number;
            limit: number;
            total: any;
        };
    }>;
    analytics(): Promise<{
        success: boolean;
        data: {
            platformSavings: number;
            couponRedemptions: any;
            promotionRedemptions: any;
            topCoupons: any;
            abuseCandidates: any;
        };
    }>;
    createCampaign(user: RequestUser, dto: CreateCouponDto): Promise<{
        success: boolean;
        data: {
            id: any;
            code: any;
            name: any;
            description: any;
            type: any;
            kind: any;
            scope: any;
            sponsor: any;
            storeId: any;
            discountValue: number;
            maxDiscount: number | null;
            minOrderAmount: number;
            usageLimit: any;
            usedCount: any;
            perUserLimit: any;
            firstOrderOnly: any;
            startsAt: any;
            expiresAt: any;
            isActive: any;
            suspendedAt: any;
        };
    }>;
    suspend(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            id: any;
            code: any;
            name: any;
            description: any;
            type: any;
            kind: any;
            scope: any;
            sponsor: any;
            storeId: any;
            discountValue: number;
            maxDiscount: number | null;
            minOrderAmount: number;
            usageLimit: any;
            usedCount: any;
            perUserLimit: any;
            firstOrderOnly: any;
            startsAt: any;
            expiresAt: any;
            isActive: any;
            suspendedAt: any;
        };
    }>;
}
