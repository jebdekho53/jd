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
            rules: {
                id: string;
                scope: import("@prisma/client").$Enums.CommissionRuleScope;
                storeId: string | null;
                storeName: string | null;
                categoryId: string | null;
                categoryName: string | null;
                commissionPercent: number;
                settlementDelayDays: number;
                isActive: boolean;
                updatedAt: Date;
            }[];
        };
    }>;
    createCommissionRule(dto: CreateCommissionRuleDto): Promise<{
        success: boolean;
        data: {
            id: string;
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
        };
    }>;
    alerts(): Promise<{
        success: boolean;
        data: {
            message: string;
            id: string;
            status: import("@prisma/client").$Enums.FinanceAlertStatus;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            severity: import("@prisma/client").$Enums.FinanceAlertSeverity;
            title: string;
            resolvedAt: Date | null;
            alertType: import("@prisma/client").$Enums.FinanceAlertType;
        }[];
    }>;
    revenue(): Promise<{
        success: boolean;
        data: Record<string, number>;
    }>;
    settlements(query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
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
            records: {
                id: string;
                rider: string;
                orderNumber: string | null;
                amountExpected: number;
                amountCollected: number;
                amountDeposited: number;
                mismatchAmount: number;
                status: import("@prisma/client").$Enums.CodReconciliationStatus;
                submittedAt: string | null;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
            };
        };
    }>;
    codSummary(): Promise<{
        success: boolean;
        data: {
            codPending: number;
            codPendingCount: number;
            codSubmitted: number;
            codSubmittedCount: number;
            codDeposited: number;
            codVerifiedCount: number;
            mismatchCount: number;
        };
    }>;
    verifyCod(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.CodReconciliationStatus;
            createdAt: Date;
            updatedAt: Date;
            orderId: string | null;
            riderProfileId: string | null;
            providerType: import("@prisma/client").$Enums.DeliveryProviderType | null;
            amountExpected: import("@prisma/client/runtime/library").Decimal;
            amountCollected: import("@prisma/client/runtime/library").Decimal;
            amountDeposited: import("@prisma/client/runtime/library").Decimal;
            mismatchAmount: import("@prisma/client/runtime/library").Decimal;
            submittedAt: Date | null;
            verifiedAt: Date | null;
            verifiedBy: string | null;
            rejectionReason: string | null;
            notes: string | null;
        };
    }>;
    rejectCod(user: RequestUser, id: string, dto: RejectCodDto): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.CodReconciliationStatus;
            createdAt: Date;
            updatedAt: Date;
            orderId: string | null;
            riderProfileId: string | null;
            providerType: import("@prisma/client").$Enums.DeliveryProviderType | null;
            amountExpected: import("@prisma/client/runtime/library").Decimal;
            amountCollected: import("@prisma/client/runtime/library").Decimal;
            amountDeposited: import("@prisma/client/runtime/library").Decimal;
            mismatchAmount: import("@prisma/client/runtime/library").Decimal;
            submittedAt: Date | null;
            verifiedAt: Date | null;
            verifiedBy: string | null;
            rejectionReason: string | null;
            notes: string | null;
        };
    }>;
    failedRefunds(query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            refunds: {
                id: string;
                orderId: string;
                orderNumber: string;
                amount: number;
                razorpayAmount: number;
                walletAmount: number;
                status: import("@prisma/client").$Enums.OrderRefundStatus;
                retryCount: number;
                lastError: string | null;
                razorpayRefundId: string | null;
                createdAt: string;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
            };
        };
    }>;
    merchantPayouts(query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            payoutRequests: {
                id: string;
                merchant: string;
                merchantProfileId: string;
                gstNumber: string | null;
                amount: number;
                status: import("@prisma/client").$Enums.PayoutRequestStatus;
                bankDetails: import("@prisma/client/runtime/library").JsonValue;
                rejectionReason: string | null;
                requestedAt: string;
                reviewedAt: string | null;
                processedAt: string | null;
                transaction: {
                    id: string;
                    status: import("@prisma/client").$Enums.PayoutTransactionStatus;
                    processedAt: Date | null;
                    createdAt: Date;
                    amount: import("@prisma/client/runtime/library").Decimal;
                    referenceId: string | null;
                    failureReason: string | null;
                    payoutRequestId: string;
                };
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    listRiderPayouts(query: ListFinanceQueryDto): Promise<{
        success: boolean;
        data: {
            payouts: {
                id: string;
                rider: string;
                riderProfileId: string;
                status: import("@prisma/client").$Enums.RiderPayoutStatus;
                totalAmount: number;
                deliveryCount: number;
                periodStart: string;
                periodEnd: string;
                paidAt: string | null;
            }[];
            meta: {
                page: number;
                limit: number;
                total: number;
            };
        };
    }>;
    payRider(user: RequestUser, id: string, dto: MarkRiderPayoutPaidDto): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.RiderPayoutStatus;
            createdAt: Date;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paidAt: Date | null;
            riderProfileId: string;
            referenceId: string | null;
            periodStart: Date;
            periodEnd: Date;
            baseFee: import("@prisma/client/runtime/library").Decimal;
            distanceBonus: import("@prisma/client/runtime/library").Decimal;
            peakBonus: import("@prisma/client/runtime/library").Decimal;
            rainBonus: import("@prisma/client/runtime/library").Decimal;
            incentives: import("@prisma/client/runtime/library").Decimal;
            cancellationComp: import("@prisma/client/runtime/library").Decimal;
        };
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
