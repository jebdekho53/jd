import { AdCampaignStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class AdBudgetService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    activeWindowFilter(): {
        OR: ({
            startAt: null;
        } | {
            startAt: {
                lte: Date;
            };
        })[];
        AND: {
            OR: ({
                endAt: null;
            } | {
                endAt: {
                    gte: Date;
                };
            })[];
        }[];
    };
    hasBudget(campaign: {
        budget: unknown;
        spentAmount: unknown;
        status: AdCampaignStatus;
    }): boolean;
    canSpend(campaignId: string, amount: number): Promise<boolean>;
    deductSpend(campaignId: string, amount: number): Promise<void>;
    checkDailyCap(campaignId: string, groupDailyBudget: number): Promise<boolean>;
}
