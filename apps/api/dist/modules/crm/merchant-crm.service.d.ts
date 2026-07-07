import { PrismaService } from '../../database/prisma.service';
export declare class MerchantCrmService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCustomers(userId: string, storeId?: string): Promise<{
        repeatCustomers: {
            userId: string | undefined;
            name: string | undefined;
            phone: string | undefined;
            orderCount: number;
            totalSpent: number;
        }[];
        topSpenders: {
            userId: string | undefined;
            name: string | undefined;
            phone: string | undefined;
            totalSpent: number;
            orderCount: number;
        }[];
        loyaltyMembers: {
            userId: string;
            name: string;
            phone: string;
            tier: import("@prisma/client").$Enums.LoyaltyTier;
            points: number;
        }[];
        winBack: {
            userId: string | undefined;
            name: string | undefined;
            phone: string | undefined;
            lastOrderAt: Date | null;
        }[];
        couponUsers: {
            userId: string | undefined;
            name: string | undefined;
            phone: string | undefined;
        }[];
        campaignPerformance: {
            id: string;
            name: string;
            status: import("@prisma/client").$Enums.CampaignStatus;
            impressions: number;
            clicks: number;
            redemptions: number;
            spent: number;
        }[];
    }>;
}
