import { Injectable } from '@nestjs/common';
import { AdCampaignStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { computeCtr, rankAdAuction } from './ad-auction.util';
import { AdBudgetService } from './ad-budget.service';

@Injectable()
export class KeywordAuctionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budget: AdBudgetService,
  ) {}

  async rankForKeyword(keyword: string, maxSlots = 3) {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return [];

    const bids = await this.prisma.keywordBid.findMany({
      where: {
        keyword: { contains: normalized, mode: 'insensitive' },
        campaign: { status: AdCampaignStatus.ACTIVE },
      },
      include: {
        campaign: {
          include: {
            sponsoredProducts: {
              include: { product: { select: { id: true, name: true, slug: true, basePrice: true, imageUrls: true, storeId: true } } },
            },
            adGroups: true,
            _count: { select: { impressions: true, clicks: true } },
          },
        },
      },
      take: 50,
    });

    const candidates = bids
      .filter((b) => this.budget.hasBudget(b.campaign))
      .flatMap((b) => {
        const ctr = computeCtr(b.campaign._count.clicks, b.campaign._count.impressions);
        const bidAmount = Number(b.bidAmount);
        return b.campaign.sponsoredProducts.map((sp) => ({
          campaignId: b.campaignId,
          productId: sp.productId,
          bidAmount,
          qualityScore: 0.7 + Math.min(0.3, ctr),
          ctr,
          priority: sp.priority,
          product: sp.product,
        }));
      });

    const ranked = rankAdAuction(
      candidates.map(({ product, ...c }) => c),
      maxSlots,
    );

    return ranked.map((r) => {
      const match = candidates.find((c) => c.campaignId === r.campaignId && c.productId === r.productId);
      return { ...match?.product, sponsored: true, campaignId: r.campaignId, auctionScore: r.auctionScore };
    });
  }
}
