import { CorporateAnalyticsService } from './corporate-analytics.service';
import { PrismaService } from '../../database/prisma.service';
export declare class AdminCorporateController {
    private readonly analytics;
    private readonly prisma;
    constructor(analytics: CorporateAnalyticsService, prisma: PrismaService);
    overview(): Promise<{
        success: boolean;
        data: {
            metrics: any;
            companies: any;
        };
    }>;
}
export declare class AdminCorporateAnalyticsController {
    private readonly analytics;
    constructor(analytics: CorporateAnalyticsService);
    corporate(): Promise<{
        success: boolean;
        data: {
            activeCompanies: any;
            totalSpend: number;
            creditLimit: any;
            creditUtilization: number;
            invoices: any;
        };
    }>;
}
