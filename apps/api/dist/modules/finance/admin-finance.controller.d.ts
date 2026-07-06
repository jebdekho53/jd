import { Response } from 'express';
import { RequestUser } from '../../common/types';
import { FinanceService } from './finance.service';
import { SettlementBatchService } from './settlement-batch.service';
import { CodReconciliationService } from './cod-reconciliation.service';
import { RiderPayoutService } from './rider-payout.service';
import { FinanceExportService } from './finance-export.service';
import { OrderRefundService } from '../payment/order-refund.service';
import { SettlementService } from '../settlement/settlement.service';
import { FinanceCommissionService } from './finance-commission.service';
import { ExportQueryDto, GenerateSettlementDto, ListFinanceQueryDto, MarkRiderPayoutPaidDto, RejectCodDto } from './dto/finance.dto';
import { CreateCommissionRuleDto, UpdateCommissionRuleDto } from './dto/commission-rule.dto';
export declare class AdminFinanceController {
    private readonly finance;
    private readonly batches;
    private readonly cod;
    private readonly riderPayouts;
    private readonly exports;
    private readonly settlement;
    private readonly orderRefunds;
    private readonly commission;
    constructor(finance: FinanceService, batches: SettlementBatchService, cod: CodReconciliationService, riderPayouts: RiderPayoutService, exports: FinanceExportService, settlement: SettlementService, orderRefunds: OrderRefundService, commission: FinanceCommissionService);
    listCommissionRules(): Promise<{
        success: boolean;
        data: {
            defaultCommissionPercent: number;
            rules: any;
        };
    }>;
    createCommissionRule(dto: CreateCommissionRuleDto): Promise<{
        success: boolean;
        data: {
            id: any;
        };
    }>;
    updateCommissionRule(id: string, dto: UpdateCommissionRuleDto): Promise<{
        success: boolean;
        data: {
            id: string;
        };
    }>;
    deleteCommissionRule(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
        };
    }>;
    overview(): Promise<{
        success: boolean;
        data: {
            revenue: any;
            settlement: any;
            cod: any;
            ledgerBalances: any;
            walletLiability: number;
            refundOrderCount: any;
            escrowBalance: any;
            merchantPayable: any;
        };
    }>;
    alerts(): Promise<{
        success: boolean;
        data: any;
    }>;
    revenue(): Promise<{
        success: boolean;
        data: Record<string, number>;
    }>;
    settlements(query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            settlements: any;
            meta: {
                page: number;
                limit: number;
                total: any;
            };
        };
    }>;
    generateSettlements(dto: GenerateSettlementDto): Promise<{
        success: boolean;
        data: {
            batchesCreated: number;
        };
    }>;
    codList(query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            records: any;
            meta: {
                page: number;
                limit: number;
                total: any;
            };
        };
    }>;
    codSummary(): Promise<{
        success: boolean;
        data: {
            codPending: number;
            codPendingCount: any;
            codSubmitted: number;
            codSubmittedCount: any;
            codDeposited: number;
            codVerifiedCount: any;
            mismatchCount: any;
        };
    }>;
    verifyCod(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    rejectCod(user: RequestUser, id: string, dto: RejectCodDto): Promise<{
        success: boolean;
        data: any;
    }>;
    failedRefunds(query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            refunds: any;
            meta: {
                page: number;
                limit: number;
                total: any;
            };
        };
    }>;
    merchantPayouts(query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            payoutRequests: any;
            meta: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    listRiderPayouts(query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            payouts: any;
            meta: {
                page: number;
                limit: number;
                total: any;
            };
        };
    }>;
    payRider(user: RequestUser, id: string, dto: MarkRiderPayoutPaidDto): Promise<{
        success: boolean;
        data: any;
    }>;
    taxes(query: ExportQueryDto): Promise<{
        success: boolean;
        data: {
            period: string;
            csv: string;
        };
    }>;
    exportSettlements(res: Response, query: ExportQueryDto): Promise<void>;
    exportPayouts(res: Response): Promise<void>;
}
