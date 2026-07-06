import { Body } from '@nestjs/common';
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
            coupon?: Body;
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
        data: any;
    }>;
}
