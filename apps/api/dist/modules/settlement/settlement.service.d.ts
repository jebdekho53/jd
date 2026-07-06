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
        recentOrdersRevenue: any;
        settlementHistory: any;
        openPayoutRequest: {
            id: any;
            amount: number;
            status: any;
            requestedAt: any;
        } | null;
    }>;
    listMerchantSettlements(userId: string, query: ListSettlementsQueryDto): Promise<{
        settlements: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    createPayoutRequest(userId: string, dto: CreatePayoutRequestDto): Promise<{
        id: any;
        amount: number;
        status: any;
        requestedAt: any;
    }>;
    listMerchantPayouts(userId: string, query: ListSettlementsQueryDto): Promise<{
        payouts: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getAdminSettlementsOverview(): Promise<{
        summary: {
            pendingPayouts: any;
            completedPayouts: any;
            totalMerchantLiability: number;
            availableLiability: number;
            pendingLiability: number;
            totalSettledToday: number;
            settlementsSettledToday: any;
        };
        merchantWallets: any;
        settlementLedger: any;
    }>;
    listAdminPayoutRequests(query: ListSettlementsQueryDto): Promise<{
        payoutRequests: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    approvePayoutRequest(adminUserId: string, payoutId: string): Promise<{
        id: any;
        status: any;
    }>;
    rejectPayoutRequest(adminUserId: string, payoutId: string, dto: RejectPayoutRequestDto): Promise<{
        id: any;
        status: any;
    }>;
    processPayoutRequest(adminUserId: string, payoutId: string): Promise<{
        id: string;
        status: any;
        referenceId: any;
        transactionId: any;
    }>;
    assertMerchantOwnsPayout(userId: string, payoutId: string): Promise<void>;
}
