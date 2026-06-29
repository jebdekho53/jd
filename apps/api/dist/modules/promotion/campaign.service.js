"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const offer_cache_service_1 = require("./offer-cache.service");
let CampaignService = class CampaignService {
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
    }
    async createPlatformCampaign(adminUserId, dto) {
        return this.createCampaign(adminUserId, null, client_1.CampaignScope.PLATFORM, dto);
    }
    async createMerchantCampaign(userId, storeId, dto) {
        await this.assertStoreOwned(userId, storeId);
        return this.createCampaign(userId, storeId, client_1.CampaignScope.MERCHANT, dto);
    }
    async createCampaign(createdById, storeId, scope, dto) {
        const status = this.resolveStatus(dto.startsAt, dto.endsAt);
        const campaign = await this.prisma.campaign.create({
            data: {
                name: dto.name,
                description: dto.description,
                scope,
                storeId,
                status,
                stackMode: dto.stackMode ?? client_1.OfferStackMode.BEST_OFFER,
                startsAt: new Date(dto.startsAt),
                endsAt: new Date(dto.endsAt),
                budgetCap: dto.budgetCap,
                createdById,
                audiences: dto.audiences?.length
                    ? {
                        create: dto.audiences.map((a) => ({
                            audienceType: a.audienceType,
                            config: a.config,
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
        if (storeId)
            await this.cache.invalidateStore(storeId);
        return this.serializeCampaign(campaign);
    }
    async addOffer(userId, storeId, campaignId, dto) {
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
    async pauseCampaign(actorId, campaignId, storeId) {
        if (storeId)
            await this.assertStoreOwned(actorId, storeId);
        const campaign = await this.requireCampaign(campaignId, storeId);
        const updated = await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: client_1.CampaignStatus.PAUSED },
        });
        await this.cache.invalidateCampaign(campaignId);
        return this.serializeCampaign(updated);
    }
    async resumeCampaign(actorId, campaignId, storeId) {
        if (storeId)
            await this.assertStoreOwned(actorId, storeId);
        const campaign = await this.requireCampaign(campaignId, storeId);
        const updated = await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: client_1.CampaignStatus.ACTIVE },
        });
        await this.cache.invalidateCampaign(campaignId);
        return this.serializeCampaign(updated);
    }
    async updateCampaign(actorId, campaignId, dto, storeId) {
        if (storeId)
            await this.assertStoreOwned(actorId, storeId);
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
    async listAdmin(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const where = {
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
    async merchantPerformance(userId, storeId, campaignId) {
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
            discountGiven: Number(usages._sum.discountApplied ?? 0) + Number(usages._sum.cashbackApplied ?? 0),
            incrementalRevenue: Number(usages._sum.gmvImpact ?? 0),
        };
    }
    offerCreateData(dto, storeId) {
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
                        config: r.config,
                    })),
                }
                : undefined,
        };
    }
    resolveStatus(startsAt, endsAt) {
        const now = new Date();
        const start = new Date(startsAt);
        const end = new Date(endsAt);
        if (now < start)
            return client_1.CampaignStatus.SCHEDULED;
        if (now > end)
            return client_1.CampaignStatus.ENDED;
        return client_1.CampaignStatus.ACTIVE;
    }
    async requireCampaign(campaignId, storeId) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, ...(storeId && { storeId }) },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        return campaign;
    }
    async assertStoreOwned(userId, storeId) {
        const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.ForbiddenException('Merchant profile not found');
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
        });
        if (!store)
            throw new common_1.ForbiddenException('Store not found');
        return store;
    }
    serializeCampaign(c) {
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
    serializeOffer(o) {
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
};
exports.CampaignService = CampaignService;
exports.CampaignService = CampaignService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        offer_cache_service_1.OfferCacheService])
], CampaignService);
//# sourceMappingURL=campaign.service.js.map