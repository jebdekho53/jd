import { PrismaService } from '../../database/prisma.service';
import { SettlementService } from '../settlement/settlement.service';
import { LedgerService } from './ledger.service';
import { FinanceCacheService } from './finance-cache.service';
import { FinanceAlertService } from './finance-alert.service';
import { CodReconciliationService } from './cod-reconciliation.service';
import { SettlementBatchService } from './settlement-batch.service';
import { RiderPayoutService } from './rider-payout.service';
import { FinanceExportService } from './finance-export.service';
export declare class FinanceService {
    private readonly prisma;
    private readonly settlement;
    private readonly ledger;
    private readonly cache;
    private readonly alerts;
    private readonly cod;
    private readonly batches;
    private readonly riderPayouts;
    private readonly exports;
    constructor(prisma: PrismaService, settlement: SettlementService, ledger: LedgerService, cache: FinanceCacheService, alerts: FinanceAlertService, cod: CodReconciliationService, batches: SettlementBatchService, riderPayouts: RiderPayoutService, exports: FinanceExportService);
    getControlTower(): Promise<{
        revenue: Record<string, number>;
        settlement: {
            pendingPayouts: number;
            completedPayouts: number;
            totalMerchantLiability: number;
            availableLiability: number;
            pendingLiability: number;
            totalSettledToday: number;
            settlementsSettledToday: number;
        };
        cod: {
            codPending: number;
            codPendingCount: number;
            codSubmitted: number;
            codSubmittedCount: number;
            codDeposited: number;
            codVerifiedCount: number;
            mismatchCount: number;
        };
        ledgerBalances: {
            code: string;
            name: string;
            debit: number;
            credit: number;
            balance: number;
        }[];
        walletLiability: number;
        refundOrderCount: number;
        escrowBalance: number;
        merchantPayable: number;
    }>;
    getAlerts(): Promise<{
        message: string;
        id: string;
        status: import("@prisma/client").$Enums.FinanceAlertStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        severity: import("@prisma/client").$Enums.FinanceAlertSeverity;
        title: string;
        resolvedAt: Date | null;
        alertType: import("@prisma/client").$Enums.FinanceAlertType;
    }[]>;
    runHealthChecks(): Promise<{
        negativeBalances: number;
        codMismatches: number;
    }>;
}
