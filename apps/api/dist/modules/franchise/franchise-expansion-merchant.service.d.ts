import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
export declare class FranchiseExpansionMerchantService {
    private readonly prisma;
    private readonly merchantDashboard;
    constructor(prisma: PrismaService, merchantDashboard: MerchantDashboardService);
    getExpansionOpportunities(userId: string, storeId?: string): Promise<{
        id: string;
        title: string;
        description: string;
        impact: string;
        type: string;
    }[]>;
}
