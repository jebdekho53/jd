import { PrismaService } from '../../database/prisma.service';
export declare class CorporateAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAdminAnalytics(): Promise<{
        activeCompanies: number;
        totalSpend: number;
        creditLimit: number;
        creditUtilization: number;
        invoices: number;
    }>;
    getAccountSpend(accountId: string): Promise<{
        totalSpend: number;
        orderCount: number;
    }>;
}
