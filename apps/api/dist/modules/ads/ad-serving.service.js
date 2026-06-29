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
exports.AdServingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const keyword_auction_service_1 = require("./keyword-auction.service");
const ad_budget_service_1 = require("./ad-budget.service");
const ad_fraud_guard_service_1 = require("./ad-fraud-guard.service");
let AdServingService = class AdServingService {
    constructor(prisma, auction, budget, fraudGuard) {
        this.prisma = prisma;
        this.auction = auction;
        this.budget = budget;
        this.fraudGuard = fraudGuard;
    }
    async getSponsoredProductsForSearch(query, limit = 3) {
        return this.auction.rankForKeyword(query, limit);
    }
    async getSponsoredStoresForHome(limit = 3) {
        const campaigns = await this.prisma.adCampaign.findMany({
            where: { status: client_1.AdCampaignStatus.ACTIVE, ...this.budget.activeWindowFilter() },
            include: {
                sponsoredStores: { include: { store: { select: { id: true, name: true, slug: true, logoUrl: true } } } },
                adGroups: true,
            },
            take: 20,
        });
        const eligible = campaigns.filter((c) => this.budget.hasBudget(c));
        const stores = eligible.flatMap((c) => c.sponsoredStores.map((s) => ({
            ...s.store,
            sponsored: true,
            campaignId: c.id,
            priority: s.priority,
        })));
        return stores.sort((a, b) => b.priority - a.priority).slice(0, limit);
    }
    async getSponsoredProductsForHome(limit = 6) {
        const rows = await this.prisma.sponsoredProduct.findMany({
            where: { campaign: { status: client_1.AdCampaignStatus.ACTIVE } },
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
    async recordImpression(campaignId, placement, userId, cost = 0) {
        if (userId && (await this.fraudGuard.checkImpressionFraud(userId, campaignId)))
            return null;
        if (!(await this.budget.canSpend(campaignId, cost)))
            return null;
        await this.budget.deductSpend(campaignId, cost);
        return this.prisma.adImpression.create({
            data: { campaignId, placement, userId, cost },
        });
    }
    async recordClick(campaignId, userId, cost = 0) {
        if (userId && (await this.fraudGuard.checkClickFraud(userId, campaignId)))
            return null;
        if (!(await this.budget.canSpend(campaignId, cost)))
            return null;
        await this.budget.deductSpend(campaignId, cost);
        return this.prisma.adClick.create({ data: { campaignId, userId, cost } });
    }
    async recordConversion(campaignId, orderId, revenue) {
        return this.prisma.adConversion.create({
            data: { campaignId, orderId, revenue },
        });
    }
};
exports.AdServingService = AdServingService;
exports.AdServingService = AdServingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        keyword_auction_service_1.KeywordAuctionService,
        ad_budget_service_1.AdBudgetService,
        ad_fraud_guard_service_1.AdFraudGuardService])
], AdServingService);
//# sourceMappingURL=ad-serving.service.js.map