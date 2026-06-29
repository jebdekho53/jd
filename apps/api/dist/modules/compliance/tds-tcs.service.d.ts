import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class TdsTcsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recordMerchantTds(merchantProfileId: string, periodMonth: string, taxableAmount: number, tdsRate?: number): Promise<{
        id: string;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        merchantProfileId: string;
        taxableAmount: Prisma.Decimal;
        periodMonth: string;
        tdsRate: Prisma.Decimal;
        tdsAmount: Prisma.Decimal;
    }>;
    recordPlatformTcs(periodMonth: string, gmvAmount: number, tcsRate?: number): Promise<{
        id: string;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        periodMonth: string;
        gmvAmount: Prisma.Decimal;
        tcsRate: Prisma.Decimal;
        tcsAmount: Prisma.Decimal;
    }>;
    merchantTdsSummary(merchantProfileId: string, periodMonth?: string): Promise<{
        records: {
            periodMonth: string;
            taxableAmount: number;
            tdsRate: number;
            tdsAmount: number;
        }[];
        totalTds: number;
    }>;
    platformTcsSummary(periodMonth?: string): Promise<{
        records: {
            periodMonth: string;
            gmvAmount: number;
            tcsRate: number;
            tcsAmount: number;
        }[];
        totalTcs: number;
    }>;
    syncMonthlyFromInvoices(periodMonth: string): Promise<{
        merchants: number;
        platformGmv: number;
    }>;
}
