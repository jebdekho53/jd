import { Injectable } from '@nestjs/common';
import { FraudCaseCategory } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FraudCaseService } from '../trust-safety/fraud-case.service';

@Injectable()
export class AdFraudGuardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fraudCases: FraudCaseService,
  ) {}

  /** Detect suspicious click bursts — logs risk event metadata */
  async checkClickFraud(userId: string | undefined, campaignId: string): Promise<boolean> {
    if (!userId) return false;
    const since = new Date(Date.now() - 60 * 1000);
    const recent = await this.prisma.adClick.count({
      where: { userId, campaignId, createdAt: { gte: since } },
    });
    if (recent >= 5) {
      void this.fraudCases.openCase({
        userId,
        category: FraudCaseCategory.BOT_TRAFFIC,
        severity: 'MEDIUM',
        title: 'Ad click fraud suspected',
        description: `${recent} ad clicks in 60s for campaign ${campaignId}`,
        subjectType: 'ad_campaign',
        subjectId: campaignId,
        idempotencyKey: `ad-click-fraud:${userId}:${campaignId}:${Math.floor(Date.now() / 60000)}`,
      });
      return true;
    }
    return false;
  }

  async checkImpressionFraud(userId: string | undefined, campaignId: string): Promise<boolean> {
    if (!userId) return false;
    const since = new Date(Date.now() - 60 * 1000);
    const recent = await this.prisma.adImpression.count({
      where: { userId, campaignId, createdAt: { gte: since } },
    });
    if (recent >= 20) {
      void this.fraudCases.openCase({
        userId,
        category: FraudCaseCategory.BOT_TRAFFIC,
        severity: 'LOW',
        title: 'Ad impression fraud suspected',
        description: `${recent} impressions in 60s for campaign ${campaignId}`,
        subjectType: 'ad_campaign',
        subjectId: campaignId,
        idempotencyKey: `ad-imp-fraud:${userId}:${campaignId}:${Math.floor(Date.now() / 60000)}`,
      });
      return true;
    }
    return false;
  }
}
