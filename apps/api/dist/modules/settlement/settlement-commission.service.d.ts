import { PrismaService } from '../../database/prisma.service';
export interface CommissionResolution {
    commissionPercent: number;
    settlementDelayDays: number;
}
export declare class SettlementCommissionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    resolveForOrder(merchantProfileId: string, orderId: string): Promise<CommissionResolution>;
    private resolveDominantCategoryId;
}
