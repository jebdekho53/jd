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
        revenue: any;
        settlement: any;
        cod: any;
        ledgerBalances: any;
        walletLiability: number;
        refundOrderCount: any;
        escrowBalance: any;
        merchantPayable: any;
    }>;
    getAlerts(): Promise<any>;
    runHealthChecks(): Promise<{
        negativeBalances: number;
        codMismatches: number;
    }>;
}
