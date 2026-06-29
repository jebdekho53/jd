import { MembershipBenefitType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare const PLUS_REWARD_MULTIPLIER = 1.5;
export declare class MembershipBenefitService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getActiveBenefits(userId: string): Promise<import("@prisma/client").$Enums.MembershipBenefitType[]>;
    hasBenefit(userId: string, type: MembershipBenefitType): Promise<boolean>;
    hasFreeDelivery(userId: string): Promise<boolean>;
    getRewardMultiplier(benefits: MembershipBenefitType[]): number;
    recordUsage(userId: string, benefitType: MembershipBenefitType, orderId?: string): Promise<{
        id: string;
        createdAt: Date;
        orderId: string | null;
        benefitType: import("@prisma/client").$Enums.MembershipBenefitType;
        subscriptionId: string;
    } | null>;
    isVipSupport(userId: string): Promise<boolean>;
}
