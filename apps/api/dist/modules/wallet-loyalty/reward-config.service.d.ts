import { LoyaltyTier } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export interface RewardProgramRules {
    pointsPer100Inr: number;
    pointValueInr: number;
    referral: {
        referrerPoints: number;
        referredPoints: number;
        referrerWalletCredit: number;
        referredWalletCredit: number;
    };
    tierThresholds: {
        silver: number;
        gold: number;
        platinum: number;
    };
    tierMultipliers: Record<LoyaltyTier, number>;
}
export declare class RewardConfigService {
    private readonly prisma;
    private cache;
    private cacheAt;
    constructor(prisma: PrismaService);
    getRules(): Promise<RewardProgramRules>;
    updateConfig(key: string, value: unknown, adminUserId: string): Promise<{
        id: string;
        updatedAt: Date;
        value: import("@prisma/client/runtime/library").JsonValue;
        key: string;
        updatedBy: string | null;
    }>;
    invalidateCache(): void;
}
