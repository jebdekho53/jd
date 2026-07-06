import { PrismaService } from '../../database/prisma.service';
export declare class CorporateAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAdminAnalytics(): Promise<{
        activeCompanies: any;
        totalSpend: number;
        creditLimit: any;
        creditUtilization: number;
        invoices: any;
    }>;
    getAccountSpend(accountId: string): Promise<{
        totalSpend: any;
        orderCount: any;
    }>;
}
