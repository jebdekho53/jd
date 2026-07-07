import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoyaltyTier, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { RewardConfigService } from './reward-config.service';
import { WalletService } from './wallet.service';
import { MembershipBenefitService } from '../membership/membership-benefit.service';
type TxClient = Prisma.TransactionClient;
export declare class RewardService {
    private readonly prisma;
    private readonly config;
    private readonly wallet;
    private readonly domainEvents;
    private readonly events;
    private readonly membershipBenefits;
    private readonly logger;
    constructor(prisma: PrismaService, config: RewardConfigService, wallet: WalletService, domainEvents: DomainEventsService, events: EventEmitter2, membershipBenefits: MembershipBenefitService);
    computePointsForOrder(spendInr: number, tier: LoyaltyTier, rules: Awaited<ReturnType<RewardConfigService['getRules']>>): number;
    computePointsDiscount(points: number, rules: Awaited<ReturnType<RewardConfigService['getRules']>>): number;
    redeemPoints(tx: TxClient, walletId: string, points: number, orderId: string): Promise<number>;
    creditPointsForOrder(orderId: string): Promise<void>;
    getRewardsSummary(buyerProfileId: string): Promise<{
        points: number;
        tier: "silver" | "gold" | "platinum" | "bronze";
        nextTierPoints: number;
        lifetimePoints: number;
        history: {
            id: string;
            type: import("@prisma/client").$Enums.RewardTransactionType;
            points: number;
            description: string | null;
            createdAt: string;
        }[];
    }>;
    adminAdjustPoints(walletId: string, points: number, adminUserId: string, reason: string): Promise<{
        walletId: string;
        pointsAfter: number;
    }>;
    refundWalletForOrder(orderId: string, actorId: string): Promise<void>;
}
export {};
