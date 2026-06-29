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
            todayEarnings: number;
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
            recentOrders: {
                orderId: string;
                orderNumber: string;
                orderTotal: number;
                grossAmount: number;
                netAmount: number;
                createdAt: string;
            }[];
            settlementBatches: {
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
            openPayout: {
                id: string;
                amount: number;
                status: import("@prisma/client").$Enums.PayoutRequestStatus;
                requestedAt: string;
            } | null;
        };
    }>;
    settlements(user: RequestUser, query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            settlements: {
                id: string;
                orderId: string;
                orderNumber: string;
                grossAmount: number;
                deliveryFee: number;
                platformCommission: number;
                taxAmount: number;
                netAmount: number;
                commissionPercent: number;
                status: import("@prisma/client").$Enums.SettlementLedgerStatus;
                eligibleAt: string;
                settledAt: string | null;
                createdAt: string;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    payouts(user: RequestUser, query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            payouts: {
                id: string;
                amount: number;
                status: import("@prisma/client").$Enums.PayoutRequestStatus;
                rejectionReason: string | null;
                requestedAt: string;
                reviewedAt: string | null;
                processedAt: string | null;
                transaction: {
                    id: string;
                    status: import("@prisma/client").$Enums.PayoutTransactionStatus;
                    referenceId: string | null;
                } | null;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    orderBreakdown(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: {
            orderId: string;
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
            frozenAt: string;
            storeSnapshot: import("@prisma/client/runtime/library").JsonValue;
        } | null;
    }>;
    downloadStatement(user: RequestUser, res: Response): Promise<void>;
}
