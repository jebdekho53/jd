import { RequestUser } from '../../common/types';
import { SettlementService } from './settlement.service';
import { ListSettlementsQueryDto, RejectPayoutRequestDto } from './dto/settlement.dto';
export declare class AdminSettlementController {
    private readonly settlement;
    constructor(settlement: SettlementService);
    getOverview(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    listPayoutRequests(query: ListSettlementsQueryDto): Promise<{
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
    approve(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.PayoutRequestStatus;
        };
    }>;
    reject(user: RequestUser, id: string, dto: RejectPayoutRequestDto): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.PayoutRequestStatus;
        };
    }>;
    process(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            status: "COMPLETED";
            referenceId: string;
            transactionId: string;
        };
    }>;
}
