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
    getOrCreateWallet(buyerProfileId: string, referredByCode?: string): Promise<any>;
    getWalletSummary(buyerProfileId: string): Promise<{
        balance: number;
        rewardPoints: any;
        tier: any;
        referralCode: any;
        lifetimePoints: any;
        expiringCreditsCount: any;
        transactions: any;
    }>;
    creditWallet(tx: TxClient, walletId: string, amount: number, type: WalletTransactionType, opts: {
        referenceType?: string;
        referenceId?: string;
        description?: string;
        idempotencyKey?: string;
        createdBy?: string;
        expiresAt?: Date;
    }): Promise<any>;
    debitWallet(tx: TxClient, walletId: string, amount: number, opts: {
        referenceType?: string;
        referenceId?: string;
        description?: string;
        idempotencyKey?: string;
    }): Promise<any>;
    emitWalletCredited(walletId: string, buyerProfileId: string, amount: number, referenceId?: string): Promise<void>;
    emitWalletDebited(walletId: string, buyerProfileId: string, amount: number, referenceId?: string): Promise<void>;
    resolveTier(lifetimePoints: number, thresholds: {
        silver: number;
        gold: number;
        platinum: number;
    }): LoyaltyTier;
}
export {};
