import { RequestUser } from '../../common/types/index';
import { PrismaService } from '../../database/prisma.service';
import { WalletService } from './wallet.service';
import { RewardService } from './reward.service';
import { ReferralService } from './referral.service';
import { ApplyReferralDto } from './dto/wallet-loyalty.dto';
export declare class BuyerWalletController {
    private readonly prisma;
    private readonly wallet;
    private readonly reward;
    private readonly referral;
    constructor(prisma: PrismaService, wallet: WalletService, reward: RewardService, referral: ReferralService);
    getWallet(user: RequestUser): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getRewards(user: RequestUser): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getReferrals(user: RequestUser): Promise<{
        success: boolean;
        data: {
            code: string;
            inviteCount: number;
            earnings: number;
            pendingCount: number;
        };
    }>;
    applyReferral(user: RequestUser, dto: ApplyReferralDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    private requireBuyerProfile;
}
