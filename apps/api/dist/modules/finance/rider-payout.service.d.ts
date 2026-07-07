import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from './ledger.service';
import { FinanceCacheService } from './finance-cache.service';
export declare class RiderPayoutService {
    private readonly prisma;
    private readonly ledger;
    private readonly cache;
    constructor(prisma: PrismaService, ledger: LedgerService, cache: FinanceCacheService);
    getRiderEarnings(riderProfileId: string): Promise<{
        today: number;
        thisWeek: number;
        pendingPayout: number;
        totalPaid: number;
        recentDeliveries: {
            orderNumber: string;
            earning: number;
            deliveredAt: string | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        }[];
    }>;
    generateWeeklyPayout(riderProfileId: string): Promise<{
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
    } | null>;
    markPaid(payoutId: string, adminUserId: string, referenceId: string): Promise<{
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
    }>;
    listAdmin(page?: number, limit?: number): Promise<{
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
    }>;
}
