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
            rewardPoints: any;
            tier: any;
            referralCode: any;
            lifetimePoints: any;
            expiringCreditsCount: any;
            transactions: any;
        };
    }>;
    getRewards(user: RequestUser): Promise<{
        success: boolean;
        data: {
            points: any;
            tier: "bronze" | "silver" | "gold" | "platinum";
            nextTierPoints: number;
            lifetimePoints: any;
            history: any;
        };
    }>;
    getReferrals(user: RequestUser): Promise<{
        success: boolean;
        data: {
            code: any;
            inviteCount: any;
            earnings: any;
            pendingCount: any;
        };
    }>;
    applyReferral(user: RequestUser, dto: ApplyReferralDto): Promise<{
        success: boolean;
        data: any;
    }>;
    private requireBuyerProfile;
}
