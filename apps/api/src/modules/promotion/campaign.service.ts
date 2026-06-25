import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CampaignScope,
  CampaignStatus,
  OfferKind,
  OfferStackMode,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OfferCacheService } from './offer-cache.service';
import {
  CreateCampaignDto,
  CreateOfferDto,
  ListCampaignsDto,
  UpdateCampaignDto,
} from './dto/campaign.dto';

@Injectable()
export class CampaignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: OfferCacheService,
  ) {}

  async createPlatformCampaign(adminUserId: string, dto: CreateCampaignDto) {
    return this.createCampaign(adminUserId, null, CampaignScope.PLATFORM, dto);
  }

  async createMerchantCampaign(userId: string, storeId: string, dto: CreateCampaignDto) {
    await this.assertStoreOwned(userId, storeId);
    return this.createCampaign(userId, storeId, CampaignScope.MERCHANT, dto);
  }

  private async createCampaign(
    createdById: string,
    storeId: string | null,
    scope: CampaignScope,
    dto: CreateCampaignDto,
  ) {
    const status = this.resolveStatus(dto.startsAt, dto.endsAt);
    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        scope,
        storeId,
        status,
        stackMode: dto.stackMode ?? OfferStackMode.BEST_OFFER,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        budgetCap: dto.budgetCap,
        createdById,
        audiences: dto.audiences?.length
          ? {
              create: dto.audiences.map((a) => ({
                audienceType: a.audienceType,
                config: a.config as Prisma.InputJsonValue,
              })),
            }
          : undefined,
        offers: dto.offers?.length
          ? {
              create: dto.offers.map((o) => this.offerCreateData(o, storeId)),
            }
          : undefined,
      },
      include: { offers: { include: { rules: true } }, audiences: true },
    });

    if (storeId) await this.cache.invalidateStore(storeId);
    return this.serializeCampaign(campaign);
  }

  async addOffer(userId: string, storeId: string, campaignId: string, dto: CreateOfferDto) {
    await this.assertStoreOwned(userId, storeId);
    const campaign = await this.requireCampaign(campaignId, storeId);
    const offer = await this.prisma.offer.create({
      data: {
        ...this.offerCreateData(dto, storeId),
        campaignId: campaign.id,
      },
      include: { rules: true },
    });
    await this.cache.invalidateCampaign(campaignId);
    return this.serializeOffer(offer);
  }

  async pauseCampaign(actorId: string, campaignId: string, storeId?: string) {
    if (storeId) await this.assertStoreOwned(actorId, storeId);
    const campaign = await this.requireCampaign(campaignId, storeId);
    const updated = await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: CampaignStatus.PAUSED },
    });
    await this.cache.invalidateCampaign(campaignId);
    return this.serializeCampaign(updated);
  }

  async resumeCampaign(actorId: string, campaignId: string, storeId?: string) {
    if (storeId) await this.assertStoreOwned(actorId, storeId);
    const campaign = await this.requireCampaign(campaignId, storeId);
    const updated = await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: CampaignStatus.ACTIVE },
    });
    await this.cache.invalidateCampaign(campaignId);
    return this.serializeCampaign(updated);
  }

  async updateCampaign(actorId: string, campaignId: string, dto: UpdateCampaignDto, storeId?: string) {
    if (storeId) await this.assertStoreOwned(actorId, storeId);
    await this.requireCampaign(campaignId, storeId);
    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.stackMode !== undefined && { stackMode: dto.stackMode }),
        ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
        ...(dto.endsAt !== undefined && { endsAt: new Date(dto.endsAt) }),
        ...(dto.budgetCap !== undefined && { budgetCap: dto.budgetCap }),
      },
    });
    await this.cache.invalidateCampaign(campaignId);
    return this.serializeCampaign(updated);
  }

  async listAdmin(dto: ListCampaignsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const where: Prisma.CampaignWhereInput = {
      ...(dto.scope && { scope: dto.scope }),
      ...(dto.storeId && { storeId: dto.storeId }),
      ...(dto.status && { status: dto.status }),
      ...(dto.q && { name: { contains: dto.q, mode: 'insensitive' } }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, slug: true } },
          offers: { select: { id: true, kind: true, isActive: true } },
          _count: { select: { events: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      campaigns: rows.map((c) => this.serializeCampaign(c)),
      total,
      page,
      limit,
    };
  }

  async merchantPerformance(userId: string, storeId: string, campaignId: string) {
    await this.assertStoreOwned(userId, storeId);
    const campaign = await this.requireCampaign(campaignId, storeId);
    const [impressions, clicks, redemptions, usages] = await Promise.all([
      this.prisma.campaignEvent.count({
        where: { campaignId, eventType: 'IMPRESSION' },
      }),
      this.prisma.campaignEvent.count({
        where: { campaignId, eventType: 'CLICK' },
      }),
      this.prisma.campaignEvent.count({
        where: { campaignId, eventType: 'REDEMPTION' },
      }),
      this.prisma.offerUsage.aggregate({
        where: { offer: { campaignId } },
        _sum: { discountApplied: true, cashbackApplied: true, gmvImpact: true },
        _count: { id: true },
      }),
    ]);

    const conversion = impressions > 0 ? (redemptions / impressions) * 100 : 0;

    return {
      campaign: this.serializeCampaign(campaign),
      impressions,
      clicks,
      orders: campaign.orderCount,
      redemptions,
      conversion: Math.round(conversion * 100) / 100,
      gmvGenerated: Number(campaign.gmvGenerated),
      discountGiven:
        Number(usages._sum.discountApplied ?? 0) + Number(usages._sum.cashbackApplied ?? 0),
      incrementalRevenue: Number(usages._sum.gmvImpact ?? 0),
    };
  }

  private offerCreateData(dto: CreateOfferDto, storeId: string | null) {
    return {
      storeId: storeId ?? dto.storeId,
      name: dto.name,
      description: dto.description,
      kind: dto.kind,
      target: dto.target,
      categoryId: dto.categoryId,
      productId: dto.productId,
      variantId: dto.variantId,
      discountValue: dto.discountValue,
      cashbackAmount: dto.cashbackAmount,
      rewardPointsBonus: dto.rewardPointsBonus,
      buyQuantity: dto.buyQuantity,
      getQuantity: dto.getQuantity,
      minOrderAmount: dto.minOrderAmount ?? 0,
      maxDiscount: dto.maxDiscount,
      usageLimit: dto.usageLimit,
      perUserLimit: dto.perUserLimit ?? 1,
      flashQtyLimit: dto.flashQtyLimit,
      startsAt: new Date(dto.startsAt),
      expiresAt: new Date(dto.expiresAt),
      priority: dto.priority ?? 0,
      rules: dto.rules?.length
        ? {
            create: dto.rules.map((r) => ({
              ruleType: r.ruleType,
              config: r.config as Prisma.InputJsonValue,
            })),
          }
        : undefined,
    };
  }

  private resolveStatus(startsAt: string, endsAt: string): CampaignStatus {
    const now = new Date();
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (now < start) return CampaignStatus.SCHEDULED;
    if (now > end) return CampaignStatus.ENDED;
    return CampaignStatus.ACTIVE;
  }

  private async requireCampaign(campaignId: string, storeId?: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, ...(storeId && { storeId }) },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  private async assertStoreOwned(userId: string, storeId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Merchant profile not found');
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
    });
    if (!store) throw new ForbiddenException('Store not found');
    return store;
  }

  serializeCampaign(c: {
    id: string;
    name: string;
    description: string | null;
    scope: CampaignScope;
    storeId: string | null;
    status: CampaignStatus;
    stackMode: OfferStackMode;
    startsAt: Date;
    endsAt: Date;
    budgetCap: Prisma.Decimal | null;
    spentAmount: Prisma.Decimal;
    impressionCount: number;
    clickCount: number;
    orderCount: number;
    gmvGenerated: Prisma.Decimal;
    offers?: unknown[];
    store?: unknown;
  }) {
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      scope: c.scope,
      storeId: c.storeId,
      status: c.status,
      stackMode: c.stackMode,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      budgetCap: c.budgetCap ? Number(c.budgetCap) : null,
      spentAmount: Number(c.spentAmount),
      impressionCount: c.impressionCount,
      clickCount: c.clickCount,
      orderCount: c.orderCount,
      gmvGenerated: Number(c.gmvGenerated),
      offerCount: Array.isArray(c.offers) ? c.offers.length : undefined,
      store: c.store ?? undefined,
    };
  }

  private serializeOffer(o: {
    id: string;
    campaignId: string;
    name: string;
    kind: OfferKind;
    discountValue: Prisma.Decimal;
    expiresAt: Date;
    isActive: boolean;
  }) {
    return {
      id: o.id,
      campaignId: o.campaignId,
      name: o.name,
      kind: o.kind,
      discountValue: Number(o.discountValue),
      expiresAt: o.expiresAt.toISOString(),
      isActive: o.isActive,
    };
  }
}
