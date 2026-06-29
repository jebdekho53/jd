import { RequestUser } from '../../common/types';
import { SettlementService } from './settlement.service';
import { CreatePayoutRequestDto, ListSettlementsQueryDto } from './dto/settlement.dto';
export declare class MerchantSettlementController {
    private readonly settlement;
    constructor(settlement: SettlementService);
    getEarnings(user: RequestUser): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    listSettlements(user: RequestUser, query: ListSettlementsQueryDto): Promise<{
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
    createPayout(user: RequestUser, dto: CreatePayoutRequestDto): Promise<{
        success: boolean;
        data: {
            id: string;
            amount: number;
            status: import("@prisma/client").$Enums.PayoutRequestStatus;
            requestedAt: string;
        };
    }>;
    listPayouts(user: RequestUser, query: ListSettlementsQueryDto): Promise<{
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
}
