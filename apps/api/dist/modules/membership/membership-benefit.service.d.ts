import { MembershipBenefitType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare const PLUS_REWARD_MULTIPLIER = 1.5;
export declare class MembershipBenefitService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getActiveBenefits(userId: string): Promise<any>;
    hasBenefit(userId: string, type: MembershipBenefitType): Promise<any>;
    hasFreeDelivery(userId: string): Promise<any>;
    getRewardMultiplier(benefits: MembershipBenefitType[]): number;
    recordUsage(userId: string, benefitType: MembershipBenefitType, orderId?: string): Promise<any>;
    isVipSupport(userId: string): Promise<any>;
}
