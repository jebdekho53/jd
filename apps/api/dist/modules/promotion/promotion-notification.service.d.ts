import { PrismaService } from '../../database/prisma.service';
export declare class PromotionNotificationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    notifyStorePromotion(storeId: string, promotionName: string): Promise<void>;
    notifyCouponExpiring(userId: string, couponCode: string, expiresAt: Date): Promise<void>;
    notifyOfferExpiring(userId: string, offerName: string, storeName: string): Promise<void>;
    private createInApp;
}
