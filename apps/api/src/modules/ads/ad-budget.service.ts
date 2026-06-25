import { Injectable } from '@nestjs/common';
import { AdCampaignStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdBudgetService {
  constructor(private readonly prisma: PrismaService) {}

  activeWindowFilter() {
    const now = new Date();
    return {
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    };
  }

  hasBudget(campaign: { budget: unknown; spentAmount: unknown; status: AdCampaignStatus }) {
    if (campaign.status !== AdCampaignStatus.ACTIVE) return false;
    return Number(campaign.spentAmount) < Number(campaign.budget);
  }

  async canSpend(campaignId: string, amount: number) {
    const campaign = await this.prisma.adCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return false;
    return Number(campaign.spentAmount) + amount <= Number(campaign.budget);
  }

  async deductSpend(campaignId: string, amount: number) {
    if (amount <= 0) return;
    const campaign = await this.prisma.adCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return;
    const newSpent = Number(campaign.spentAmount) + amount;
    const status = newSpent >= Number(campaign.budget) ? AdCampaignStatus.COMPLETED : campaign.status;
    await this.prisma.adCampaign.update({
      where: { id: campaignId },
      data: { spentAmount: newSpent, status },
    });
  }

  async checkDailyCap(campaignId: string, groupDailyBudget: number) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [impressions, clicks] = await Promise.all([
      this.prisma.adImpression.aggregate({
        where: { campaignId, createdAt: { gte: start } },
        _sum: { cost: true },
      }),
      this.prisma.adClick.aggregate({
        where: { campaignId, createdAt: { gte: start } },
        _sum: { cost: true },
      }),
    ]);
    const todaySpend = Number(impressions._sum.cost ?? 0) + Number(clicks._sum.cost ?? 0);
    return todaySpend < groupDailyBudget;
  }
}
