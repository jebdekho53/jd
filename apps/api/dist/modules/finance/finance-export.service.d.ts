import { PrismaService } from '../../database/prisma.service';
export declare class FinanceExportService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    exportSettlementsCsv(merchantProfileId?: string): Promise<string>;
    exportTaxReport(periodMonth: string): Promise<string>;
    exportMerchantPayoutsCsv(): Promise<string>;
    exportRevenueSummary(): Promise<Record<string, number>>;
}
