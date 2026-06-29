import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class FraudService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    flagSelfReferral(walletId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.WalletFraudReviewStatus;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        walletId: string;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        reviewType: string;
    }>;
    flagDuplicateDevice(walletId: string, fingerprint: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.WalletFraudReviewStatus;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        walletId: string;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        reviewType: string;
    }>;
    flagSuspiciousCredit(walletId: string, amount: number, metadata?: Record<string, unknown>): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.WalletFraudReviewStatus;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        walletId: string;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        reviewType: string;
    } | null>;
    private createReview;
    listPendingReviews(limit?: number): Promise<({
        wallet: {
            buyerProfile: {
                id: string;
                name: string;
                userId: string;
            };
            id: string;
            referralCode: string;
            balance: Prisma.Decimal;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.WalletFraudReviewStatus;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        walletId: string;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        reviewType: string;
    })[]>;
    resolveReview(reviewId: string, adminUserId: string, approve: boolean): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.WalletFraudReviewStatus;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        walletId: string;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        reviewType: string;
    }>;
}
