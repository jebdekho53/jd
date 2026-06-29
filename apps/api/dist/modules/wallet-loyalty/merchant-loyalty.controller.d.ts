import { RequestUser } from '../../common/types/index';
import { PrismaService } from '../../database/prisma.service';
export declare class MerchantLoyaltyController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    loyaltyAnalytics(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            storeId: string;
            totalOrders: number;
            uniqueCustomers: number;
            repeatCustomers: number;
            loyaltyMembers: number;
            walletRedemptions: number;
            pointsRedemptions: number;
            revenueFromLoyaltyUsers: number;
            totalRevenue: number;
        };
    }>;
    private assertStoreOwned;
}
