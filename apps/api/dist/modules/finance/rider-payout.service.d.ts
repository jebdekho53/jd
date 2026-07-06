import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from './ledger.service';
import { FinanceCacheService } from './finance-cache.service';
export declare class RiderPayoutService {
    private readonly prisma;
    private readonly ledger;
    private readonly cache;
    constructor(prisma: PrismaService, ledger: LedgerService, cache: FinanceCacheService);
    getRiderEarnings(riderProfileId: string): Promise<{
        today: number;
        thisWeek: number;
        pendingPayout: number;
        totalPaid: number;
        recentDeliveries: any;
    }>;
    generateWeeklyPayout(riderProfileId: string): Promise<any>;
    markPaid(payoutId: string, adminUserId: string, referenceId: string): Promise<any>;
    listAdmin(page?: number, limit?: number): Promise<{
        payouts: any;
        meta: {
            page: number;
            limit: number;
            total: any;
        };
    }>;
}
