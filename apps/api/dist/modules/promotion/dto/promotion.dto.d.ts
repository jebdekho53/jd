import { CouponKind, CouponScope, CouponType, OfferSponsor, PromotionOfferType, PromotionTarget } from '@prisma/client';
export declare class ApplyCouponDto {
    code: string;
}
export declare class CreateStorePromotionDto {
    name: string;
    description?: string;
    offerType: PromotionOfferType;
    target: PromotionTarget;
    categoryId?: string;
    productId?: string;
    discountValue: number;
    buyQuantity?: number;
    getQuantity?: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    startsAt: string;
    expiresAt: string;
}
export declare class UpdateStorePromotionDto {
    name?: string;
    description?: string;
    discountValue?: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    startsAt?: string;
    expiresAt?: string;
    isActive?: boolean;
}
export declare class CreateCouponDto {
    code: string;
    name: string;
    description?: string;
    type: CouponType;
    kind?: CouponKind;
    scope: CouponScope;
    sponsor?: OfferSponsor;
    storeId?: string;
    categoryId?: string;
    productId?: string;
    discountValue: number;
    maxDiscount?: number;
    minOrderAmount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    firstOrderOnly?: boolean;
    startsAt: string;
    expiresAt: string;
}
export declare class ListPromotionsDto {
    page?: number;
    limit?: number;
    q?: string;
    status?: 'active' | 'paused' | 'expired' | 'all';
}
export declare class MerchantReplyDto {
    reply: string;
}
export declare class ListAdminPromotionsDto extends ListPromotionsDto {
    storeId?: string;
}
