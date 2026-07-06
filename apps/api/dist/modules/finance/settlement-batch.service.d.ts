import { SettlementCycle } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from './ledger.service';
import { FinanceCacheService } from './finance-cache.service';
import { FinanceAlertService } from './finance-alert.service';
import { DistributedLockService } from '../../redis/distributed-lock.service';
export declare class SettlementBatchService {
    private readonly prisma;
    private readonly ledger;
    private readonly cache;
    private readonly alerts;
    private readonly lock;
    private readonly logger;
    constructor(prisma: PrismaService, ledger: LedgerService, cache: FinanceCacheService, alerts: FinanceAlertService, lock: DistributedLockService);
    runDailySettlements(): Promise<void>;
    runWeeklySettlements(): Promise<void>;
    generateBatches(cycle: SettlementCycle, merchantProfileId?: string): Promise<number>;
    createBatchForMerchant(merchantProfileId: string, cycle: SettlementCycle, periodStart: Date, periodEnd: Date): Promise<any>;
    listSettlements(merchantProfileId?: string, page?: number, limit?: number): Promise<{
        settlements: any;
        meta: {
            page: number;
            limit: number;
            total: any;
        };
    }>;
    private periodForCycle;
}
