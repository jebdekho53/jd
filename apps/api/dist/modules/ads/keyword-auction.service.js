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
exports.KeywordAuctionService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ad_auction_util_1 = require("./ad-auction.util");
const ad_budget_service_1 = require("./ad-budget.service");
let KeywordAuctionService = class KeywordAuctionService {
    constructor(prisma, budget) {
        this.prisma = prisma;
        this.budget = budget;
    }
    async rankForKeyword(keyword, maxSlots = 3) {
        const normalized = keyword.trim().toLowerCase();
        if (!normalized)
            return [];
        const bids = await this.prisma.keywordBid.findMany({
            where: {
                keyword: { contains: normalized, mode: 'insensitive' },
                campaign: { status: client_1.AdCampaignStatus.ACTIVE },
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
            const ctr = (0, ad_auction_util_1.computeCtr)(b.campaign._count.clicks, b.campaign._count.impressions);
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
        const ranked = (0, ad_auction_util_1.rankAdAuction)(candidates.map(({ product, ...c }) => c), maxSlots);
        return ranked.map((r) => {
            const match = candidates.find((c) => c.campaignId === r.campaignId && c.productId === r.productId);
            return { ...match?.product, sponsored: true, campaignId: r.campaignId, auctionScore: r.auctionScore };
        });
    }
};
exports.KeywordAuctionService = KeywordAuctionService;
exports.KeywordAuctionService = KeywordAuctionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ad_budget_service_1.AdBudgetService])
], KeywordAuctionService);
//# sourceMappingURL=keyword-auction.service.js.map