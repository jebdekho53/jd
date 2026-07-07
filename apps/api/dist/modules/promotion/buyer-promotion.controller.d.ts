import { RequestUser } from '../../common/types';
import { CartService } from '../cart/cart.service';
import { PromotionCartService } from './promotion-cart.service';
import { OfferEngineService } from './offer-engine.service';
import { ApplyCouponDto } from './dto/promotion.dto';
export declare class BuyerPromotionController {
    private readonly cartService;
    private readonly promoCart;
    private readonly offers;
    constructor(cartService: CartService, promoCart: PromotionCartService, offers: OfferEngineService);
    validateCoupon(user: RequestUser, dto: ApplyCouponDto): Promise<{
        success: boolean;
        data: {
            valid: boolean;
            message?: string;
            coupon?: import("@prisma/client").Coupon;
        };
    }>;
    applyCoupon(user: RequestUser, dto: ApplyCouponDto): Promise<{
        success: boolean;
        data: import("../cart/cart.service").CartView | null;
    }>;
    removeCoupon(user: RequestUser): Promise<{
        success: boolean;
        data: import("../cart/cart.service").CartView | null;
    }>;
    recommended(user: RequestUser, lat?: string, lng?: string): Promise<{
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
}
