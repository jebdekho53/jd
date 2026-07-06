import { PrismaService } from '../../database/prisma.service';
export declare class MerchantCrmService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCustomers(userId: string, storeId?: string): Promise<{
        repeatCustomers: any;
        topSpenders: any;
        loyaltyMembers: any;
        winBack: any;
        couponUsers: any;
        campaignPerformance: any;
    }>;
}
