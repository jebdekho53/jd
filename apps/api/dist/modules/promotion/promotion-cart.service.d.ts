import { Coupon } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { CartView } from '../cart/cart.service';
export declare class PromotionCartService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validateCoupon(buyerProfileId: string, code: string, cart: CartView): Promise<{
        valid: boolean;
        message?: string;
        coupon?: Coupon;
    }>;
    applyCoupon(userId: string, code: string): Promise<void>;
    removeCoupon(userId: string): Promise<void>;
    private resolveCoupon;
    private requireBuyerProfileId;
}
