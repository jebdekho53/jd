import { Injectable } from '@nestjs/common';
import { AdCampaignStatus, AdPlacement } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { KeywordAuctionService } from './keyword-auction.service';
import { AdBudgetService } from './ad-budget.service';
import { AdFraudGuardService } from './ad-fraud-guard.service';

@Injectable()
export class AdServingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auction: KeywordAuctionService,
    private readonly budget: AdBudgetService,
    private readonly fraudGuard: AdFraudGuardService,
  ) {}

  async getSponsoredProductsForSearch(query: string, limit = 3) {
    return this.auction.rankForKeyword(query, limit);
  }

  async getSponsoredStoresForHome(limit = 3) {
    const campaigns = await this.prisma.adCampaign.findMany({
      where: { status: AdCampaignStatus.ACTIVE, ...this.budget.activeWindowFilter() },
      include: {
        sponsoredStores: { include: { store: { select: { id: true, name: true, slug: true, logoUrl: true } } } },
        adGroups: true,
      },
      take: 20,
    });

    const eligible = campaigns.filter((c) => this.budget.hasBudget(c));
    const stores = eligible.flatMap((c) =>
      c.sponsoredStores.map((s) => ({
        ...s.store,
        sponsored: true,
        campaignId: c.id,
        priority: s.priority,
      })),
    );
    return stores.sort((a, b) => b.priority - a.priority).slice(0, limit);
  }

  /**
   * Home-rail sponsored products, recording a HOME impression for each served
   * item so the campaign is billed and its analytics stay accurate.
   */
  async serveHomeSponsoredProducts(limit = 6, userId?: string) {
    const products = await this.getSponsoredProductsForHome(limit);
    for (const p of products) {
      if (p.campaignId) void this.recordImpression(p.campaignId, AdPlacement.HOME, userId);
    }
    return products;
  }

  async getSponsoredProductsForHome(limit = 6) {
    const rows = await this.prisma.sponsoredProduct.findMany({
      where: { campaign: { status: AdCampaignStatus.ACTIVE } },
      include: {
        product: { select: { id: true, name: true, slug: true, basePrice: true, imageUrls: true, storeId: true } },
        campaign: { include: { adGroups: true } },
      },
      orderBy: { priority: 'desc' },
      take: limit * 2,
    });

    return rows
      .filter((r) => this.budget.hasBudget(r.campaign))
      .slice(0, limit)
      .map((r) => ({ ...r.product, sponsored: true, campaignId: r.campaignId }));
  }

  async recordImpression(campaignId: string, placement: AdPlacement, userId?: string, cost = 0) {
    if (userId && (await this.fraudGuard.checkImpressionFraud(userId, campaignId))) return null;
    if (!(await this.budget.canSpend(campaignId, cost))) return null;
    await this.budget.deductSpend(campaignId, cost);
    return this.prisma.adImpression.create({
      data: { campaignId, placement, userId, cost },
    });
  }

  async recordClick(campaignId: string, userId?: string, cost = 0) {
    if (userId && (await this.fraudGuard.checkClickFraud(userId, campaignId))) return null;
    if (!(await this.budget.canSpend(campaignId, cost))) return null;
    await this.budget.deductSpend(campaignId, cost);
    return this.prisma.adClick.create({ data: { campaignId, userId, cost } });
  }

  async recordConversion(campaignId: string, orderId: string, revenue: number) {
    return this.prisma.adConversion.create({
      data: { campaignId, orderId, revenue },
    });
  }
}
