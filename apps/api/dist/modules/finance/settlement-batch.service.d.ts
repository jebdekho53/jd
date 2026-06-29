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
    createBatchForMerchant(merchantProfileId: string, cycle: SettlementCycle, periodStart: Date, periodEnd: Date): Promise<({
        items: {
            id: string;
            createdAt: Date;
            orderId: string;
            commissionAmount: import("@prisma/client/runtime/library").Decimal;
            settlementId: string;
            grossAmount: import("@prisma/client/runtime/library").Decimal;
            netAmount: import("@prisma/client/runtime/library").Decimal;
            settlementLedgerId: string | null;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.SettlementBatchStatus;
        processedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        merchantProfileId: string;
        failureReason: string | null;
        commissionAmount: import("@prisma/client/runtime/library").Decimal;
        grossAmount: import("@prisma/client/runtime/library").Decimal;
        netAmount: import("@prisma/client/runtime/library").Decimal;
        itemCount: number;
        periodStart: Date;
        periodEnd: Date;
        cycle: import("@prisma/client").$Enums.SettlementCycle;
        refundAdjustments: import("@prisma/client/runtime/library").Decimal;
        walletAdjustments: import("@prisma/client/runtime/library").Decimal;
    }) | null>;
    listSettlements(merchantProfileId?: string, page?: number, limit?: number): Promise<{
        settlements: {
            id: string;
            merchant: string;
            merchantProfileId: string;
            cycle: import("@prisma/client").$Enums.SettlementCycle;
            status: import("@prisma/client").$Enums.SettlementBatchStatus;
            grossAmount: number;
            commissionAmount: number;
            netAmount: number;
            itemCount: number;
            periodStart: string;
            periodEnd: string;
            processedAt: string | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    private periodForCycle;
}
