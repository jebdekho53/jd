import { RequestUser } from '../../common/types/index';
import { PrismaService } from '../../database/prisma.service';
import { FraudService } from './fraud.service';
import { RewardConfigService } from './reward-config.service';
import { RewardService } from './reward.service';
import { WalletService } from './wallet.service';
import { AdminAdjustPointsDto, AdminAdjustWalletDto, ResolveFraudReviewDto, UpdateRewardConfigDto } from './dto/wallet-loyalty.dto';
export declare class AdminRewardsController {
    private readonly prisma;
    private readonly config;
    private readonly wallet;
    private readonly reward;
    private readonly fraud;
    constructor(prisma: PrismaService, config: RewardConfigService, wallet: WalletService, reward: RewardService, fraud: FraudService);
    getConfig(): Promise<{
        success: boolean;
        data: import("./reward-config.service").RewardProgramRules;
    }>;
    updateConfig(user: RequestUser, key: string, dto: UpdateRewardConfigDto): Promise<{
        success: boolean;
        data: {
            id: string;
            updatedAt: Date;
            value: import("@prisma/client/runtime/library").JsonValue;
            key: string;
            updatedBy: string | null;
        };
    }>;
    analytics(): Promise<{
        success: boolean;
        data: {
            walletLiability: number;
            walletHolders: number;
            rewardPointsLiability: number;
            completedReferrals: number;
            totalBuyers: number;
            repeatPurchaseRate: number;
            topLoyalCustomers: {
                name: string;
                tier: import("@prisma/client").$Enums.LoyaltyTier;
                lifetimePoints: number;
                balance: number;
            }[];
        };
    }>;
    fraudReviews(): Promise<{
        success: boolean;
        data: ({
            wallet: {
                buyerProfile: {
                    id: string;
                    name: string;
                    userId: string;
                };
                id: string;
                referralCode: string;
                balance: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.WalletFraudReviewStatus;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            walletId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            reviewType: string;
        })[];
    }>;
    resolveFraud(user: RequestUser, id: string, dto: ResolveFraudReviewDto): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.WalletFraudReviewStatus;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            walletId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            reviewType: string;
        };
    }>;
    creditWallet(user: RequestUser, walletId: string, dto: AdminAdjustWalletDto): Promise<{
        success: boolean;
        data: {
            credited: number;
        };
    }>;
    debitWallet(user: RequestUser, walletId: string, dto: AdminAdjustWalletDto): Promise<{
        success: boolean;
        data: {
            debited: number;
        };
    }>;
    adjustPoints(user: RequestUser, walletId: string, dto: AdminAdjustPointsDto): Promise<{
        success: boolean;
        data: {
            walletId: string;
            pointsAfter: number;
        };
    }>;
}
