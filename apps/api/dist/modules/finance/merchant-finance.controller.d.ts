import { Response } from 'express';
import { RequestUser } from '../../common/types';
import { SettlementService } from '../settlement/settlement.service';
import { SettlementBatchService } from './settlement-batch.service';
import { OrderFinancialsService } from './order-financials.service';
import { FinanceExportService } from './finance-export.service';
import { ListFinanceQueryDto } from './dto/finance.dto';
import { PrismaService } from '../../database/prisma.service';
export declare class MerchantFinanceController {
    private readonly settlement;
    private readonly batches;
    private readonly orderFinancials;
    private readonly exports;
    private readonly prisma;
    constructor(settlement: SettlementService, batches: SettlementBatchService, orderFinancials: OrderFinancialsService, exports: FinanceExportService, prisma: PrismaService);
    overview(user: RequestUser): Promise<{
        success: boolean;
        data: {
            todayEarnings: any;
            wallet: {
                availableBalance: number;
                pendingBalance: number;
                totalEarned: number;
                totalPaidOut: number;
            };
            commissionBreakdown: {
                totalGross: number;
                totalCommission: number;
                totalNet: number;
            };
            pendingSettlement: number;
            paidSettlement: number;
            recentOrders: any;
            settlementBatches: any;
            openPayout: {
                id: any;
                amount: number;
                status: any;
                requestedAt: any;
            } | null;
        };
    }>;
    settlements(user: RequestUser, query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            settlements: any;
            meta: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    payouts(user: RequestUser, query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            payouts: any;
            meta: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    orderBreakdown(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: {
            orderId: any;
            subtotal: number;
            discountAmount: number;
            offerSubsidy: number;
            merchantContribution: number;
            platformContribution: number;
            deliveryFee: number;
            taxAmount: number;
            commissionPercent: number;
            commissionAmount: number;
            netMerchantEarnings: number;
            netPlatformEarnings: number;
            riderPayoutAmount: number;
            frozenAt: any;
            storeSnapshot: any;
        } | null;
    }>;
    downloadStatement(user: RequestUser, res: Response): Promise<void>;
}
