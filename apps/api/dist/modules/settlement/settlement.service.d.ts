import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SettlementCommissionService } from './settlement-commission.service';
import { FinanceCommissionService } from '../finance/finance-commission.service';
import { LedgerService } from '../finance/ledger.service';
import { FinanceCacheService } from '../finance/finance-cache.service';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { RejectPayoutRequestDto } from './dto/reject-payout-request.dto';
import { ListSettlementsQueryDto } from './dto/list-settlements-query.dto';
export declare class SettlementService {
    private readonly prisma;
    private readonly commission;
    private readonly financeCommission;
    private readonly ledger;
    private readonly financeCache;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, commission: SettlementCommissionService, financeCommission: FinanceCommissionService, ledger: LedgerService, financeCache: FinanceCacheService, audit: AuditService);
    createLedgerForDeliveredOrder(orderId: string, actorId?: string): Promise<void>;
    processEligibleSettlements(): Promise<number>;
    private requireMerchantProfile;
    private getOrCreateWallet;
    getMerchantEarnings(userId: string): Promise<{
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
        recentOrdersRevenue: {
            orderId: string;
            orderNumber: string;
            orderTotal: number;
            grossAmount: number;
            netAmount: number;
            createdAt: string;
        }[];
        settlementHistory: {
            id: string;
            orderId: string;
            orderNumber: string;
            grossAmount: number;
            platformCommission: number;
            netAmount: number;
            status: import("@prisma/client").$Enums.SettlementLedgerStatus;
            createdAt: string;
        }[];
        openPayoutRequest: {
            id: string;
            amount: number;
            status: import("@prisma/client").$Enums.PayoutRequestStatus;
            requestedAt: string;
        } | null;
    }>;
    listMerchantSettlements(userId: string, query: ListSettlementsQueryDto): Promise<{
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
    }>;
    createPayoutRequest(userId: string, dto: CreatePayoutRequestDto): Promise<{
        id: string;
        amount: number;
        status: import("@prisma/client").$Enums.PayoutRequestStatus;
        requestedAt: string;
    }>;
    listMerchantPayouts(userId: string, query: ListSettlementsQueryDto): Promise<{
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
    }>;
    getAdminSettlementsOverview(): Promise<{
        summary: {
            pendingPayouts: number;
            completedPayouts: number;
            totalMerchantLiability: number;
            availableLiability: number;
            pendingLiability: number;
            totalSettledToday: number;
            settlementsSettledToday: number;
        };
        merchantWallets: {
            merchantProfileId: string;
            businessName: string;
            availableBalance: number;
            pendingBalance: number;
            totalEarned: number;
            totalPaidOut: number;
        }[];
        settlementLedger: {
            id: string;
            orderNumber: string;
            merchant: string;
            netAmount: number;
            status: import("@prisma/client").$Enums.SettlementLedgerStatus;
            createdAt: string;
        }[];
    }>;
    listAdminPayoutRequests(query: ListSettlementsQueryDto): Promise<{
        payoutRequests: {
            id: string;
            merchant: string;
            merchantProfileId: string;
            gstNumber: string | null;
            amount: number;
            status: import("@prisma/client").$Enums.PayoutRequestStatus;
            bankDetails: Prisma.JsonValue;
            rejectionReason: string | null;
            requestedAt: string;
            reviewedAt: string | null;
            processedAt: string | null;
            transaction: {
                id: string;
                status: import("@prisma/client").$Enums.PayoutTransactionStatus;
                processedAt: Date | null;
                createdAt: Date;
                amount: Prisma.Decimal;
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
    }>;
    approvePayoutRequest(adminUserId: string, payoutId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.PayoutRequestStatus;
    }>;
    rejectPayoutRequest(adminUserId: string, payoutId: string, dto: RejectPayoutRequestDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.PayoutRequestStatus;
    }>;
    processPayoutRequest(adminUserId: string, payoutId: string): Promise<{
        id: string;
        status: "COMPLETED";
        referenceId: string;
        transactionId: string;
    }>;
    assertMerchantOwnsPayout(userId: string, payoutId: string): Promise<void>;
}
