import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { FraudService } from './fraud.service';
import { TrustSafetyHookService } from '../trust-safety/trust-safety-hook.service';
import { RewardConfigService } from './reward-config.service';
import { RewardService } from './reward.service';
import { WalletService } from './wallet.service';
export declare class ReferralService {
    private readonly prisma;
    private readonly config;
    private readonly wallet;
    private readonly reward;
    private readonly fraud;
    private readonly trustSafety;
    private readonly domainEvents;
    private readonly events;
    private readonly logger;
    constructor(prisma: PrismaService, config: RewardConfigService, wallet: WalletService, reward: RewardService, fraud: FraudService, trustSafety: TrustSafetyHookService, domainEvents: DomainEventsService, events: EventEmitter2);
    applyReferralCode(buyerProfileId: string, code: string, deviceFingerprint?: string): Promise<{
        deviceFingerprint: string | null;
        id: string;
        status: import("@prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        referrerWalletId: string;
        referredWalletId: string;
        completedAt: Date | null;
        referrerWalletCredit: import("@prisma/client/runtime/library").Decimal | null;
        referredWalletCredit: import("@prisma/client/runtime/library").Decimal | null;
        referrerRewardPoints: number | null;
        referredRewardPoints: number | null;
    }>;
    completeReferralOnFirstOrder(buyerProfileId: string, orderId: string): Promise<void>;
    getReferralSummary(buyerProfileId: string): Promise<{
        code: string;
        inviteCount: number;
        earnings: number;
        pendingCount: number;
    }>;
}
