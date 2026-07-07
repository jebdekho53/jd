import { CorporateAnalyticsService } from './corporate-analytics.service';
import { PrismaService } from '../../database/prisma.service';
export declare class AdminCorporateController {
    private readonly analytics;
    private readonly prisma;
    constructor(analytics: CorporateAnalyticsService, prisma: PrismaService);
    overview(): Promise<{
        success: boolean;
        data: {
            metrics: {
                activeCompanies: number;
                totalSpend: number;
                creditLimit: number;
                creditUtilization: number;
                invoices: number;
            };
            companies: ({
                _count: {
                    users: number;
                };
                wallet: {
                    id: string;
                    updatedAt: Date;
                    balance: import("@prisma/client/runtime/library").Decimal;
                    accountId: string;
                } | null;
            } & {
                id: string;
                status: import("@prisma/client").$Enums.CorporateAccountStatus;
                createdAt: Date;
                updatedAt: Date;
                gstin: string | null;
                companyName: string;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
            })[];
        };
    }>;
}
export declare class AdminCorporateAnalyticsController {
    private readonly analytics;
    constructor(analytics: CorporateAnalyticsService);
    corporate(): Promise<{
        success: boolean;
        data: {
            activeCompanies: number;
            totalSpend: number;
            creditLimit: number;
            creditUtilization: number;
            invoices: number;
        };
    }>;
}
