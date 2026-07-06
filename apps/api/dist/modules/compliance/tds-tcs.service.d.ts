import { PrismaService } from '../../database/prisma.service';
export declare class TdsTcsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recordMerchantTds(merchantProfileId: string, periodMonth: string, taxableAmount: number, tdsRate?: number): Promise<any>;
    recordPlatformTcs(periodMonth: string, gmvAmount: number, tcsRate?: number): Promise<any>;
    merchantTdsSummary(merchantProfileId: string, periodMonth?: string): Promise<{
        records: any;
        totalTds: number;
    }>;
    platformTcsSummary(periodMonth?: string): Promise<{
        records: any;
        totalTcs: number;
    }>;
    syncMonthlyFromInvoices(periodMonth: string): Promise<{
        merchants: number;
        platformGmv: number;
    }>;
}
