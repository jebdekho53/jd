import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoyaltyTier, Prisma, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
type TxClient = Prisma.TransactionClient;
export declare class WalletService {
    private readonly prisma;
    private readonly domainEvents;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, domainEvents: DomainEventsService, events: EventEmitter2);
    generateReferralCode(): string;
    getOrCreateWallet(buyerProfileId: string, referredByCode?: string): Promise<{
        deviceFingerprint: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        buyerProfileId: string;
        referralCode: string;
        balance: Prisma.Decimal;
        rewardPoints: number;
        lifetimePoints: number;
        tier: import("@prisma/client").$Enums.LoyaltyTier;
        referredById: string | null;
    }>;
    getWalletSummary(buyerProfileId: string): Promise<{
        balance: number;
        rewardPoints: number;
        tier: import("@prisma/client").$Enums.LoyaltyTier;
        referralCode: string;
        lifetimePoints: number;
        expiringCreditsCount: number;
        transactions: {
            id: string;
            type: import("@prisma/client").$Enums.WalletTransactionType;
            amount: number;
            balanceAfter: number;
            description: string | null;
            referenceType: string | null;
            referenceId: string | null;
            expiresAt: string | null;
            createdAt: string;
        }[];
    }>;
    creditWallet(tx: TxClient, walletId: string, amount: number, type: WalletTransactionType, opts: {
        referenceType?: string;
        referenceId?: string;
        description?: string;
        idempotencyKey?: string;
        createdBy?: string;
        expiresAt?: Date;
    }): Promise<{
        idempotencyKey: string | null;
        type: import("@prisma/client").$Enums.WalletTransactionType;
        id: string;
        createdAt: Date;
        expiresAt: Date | null;
        description: string | null;
        amount: Prisma.Decimal;
        walletId: string;
        balanceAfter: Prisma.Decimal;
        referenceType: string | null;
        referenceId: string | null;
        createdBy: string | null;
    }>;
    debitWallet(tx: TxClient, walletId: string, amount: number, opts: {
        referenceType?: string;
        referenceId?: string;
        description?: string;
        idempotencyKey?: string;
    }): Promise<{
        idempotencyKey: string | null;
        type: import("@prisma/client").$Enums.WalletTransactionType;
        id: string;
        createdAt: Date;
        expiresAt: Date | null;
        description: string | null;
        amount: Prisma.Decimal;
        walletId: string;
        balanceAfter: Prisma.Decimal;
        referenceType: string | null;
        referenceId: string | null;
        createdBy: string | null;
    }>;
    emitWalletCredited(walletId: string, buyerProfileId: string, amount: number, referenceId?: string): Promise<void>;
    emitWalletDebited(walletId: string, buyerProfileId: string, amount: number, referenceId?: string): Promise<void>;
    resolveTier(lifetimePoints: number, thresholds: {
        silver: number;
        gold: number;
        platinum: number;
    }): LoyaltyTier;
}
export {};
