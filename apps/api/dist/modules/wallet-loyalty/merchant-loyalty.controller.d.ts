import { RequestUser } from '../../common/types/index';
import { PrismaService } from '../../database/prisma.service';
export declare class MerchantLoyaltyController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    loyaltyAnalytics(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: {
            storeId: string;
            totalOrders: any;
            uniqueCustomers: number;
            repeatCustomers: number;
            loyaltyMembers: number;
            walletRedemptions: any;
            pointsRedemptions: any;
            revenueFromLoyaltyUsers: number;
            totalRevenue: any;
        };
    }>;
    private assertStoreOwned;
}
