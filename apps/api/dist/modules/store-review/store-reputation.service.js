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
var StoreReputationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreReputationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const buyer_cache_service_1 = require("../buyer/buyer-cache.service");
const REVIEWABLE_STATUSES = [
    client_1.OrderStatus.DELIVERED,
    client_1.OrderStatus.COMPLETED,
];
const VISIBLE_REVIEW = { status: client_1.ReviewStatus.VISIBLE };
let StoreReputationService = StoreReputationService_1 = class StoreReputationService {
    constructor(prisma, buyerCache) {
        this.prisma = prisma;
        this.buyerCache = buyerCache;
        this.logger = new common_1.Logger(StoreReputationService_1.name);
    }
    async recomputeStoreReputation(storeId) {
        const reviews = await this.prisma.review.findMany({
            where: { storeId, ...VISIBLE_REVIEW },
            select: {
                rating: true,
                merchantReply: true,
                buyerProfileId: true,
            },
        });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
            : 0;
        const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        for (const r of reviews) {
            const key = String(Math.min(5, Math.max(1, r.rating)));
            distribution[key] += 1;
        }
        const distributionPct = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        if (totalReviews > 0) {
            for (const k of ['1', '2', '3', '4', '5']) {
                distributionPct[k] = Math.round((distribution[k] / totalReviews) * 1000) / 10;
            }
        }
        const buyerCounts = new Map();
        for (const r of reviews) {
            buyerCounts.set(r.buyerProfileId, (buyerCounts.get(r.buyerProfileId) ?? 0) + 1);
        }
        const repeatCustomers = [...buyerCounts.values()].filter((c) => c > 1).length;
        const replied = reviews.filter((r) => Boolean(r.merchantReply?.trim())).length;
        const responseRate = totalReviews > 0 ? Math.round((replied / totalReviews) * 1000) / 10 : 0;
        const [fulfillmentRate, cancellationRate, avgDeliveryMins] = await this.computeOperationalMetrics(storeId);
        const rankingScore = this.computeRankingScore({
            averageRating,
            totalReviews,
            fulfillmentRate,
            cancellationRate,
            avgDeliveryMins,
        });
        const reputation = {
            averageRating,
            totalReviews,
            distribution,
            distributionPct,
            repeatCustomers,
            responseRate,
            rankingScore,
        };
        const store = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                ratingAvg: averageRating,
                ratingCount: totalReviews,
                reputationStats: reputation,
            },
            select: { slug: true },
        });
        await this.buyerCache.invalidateStoreCache(store.slug);
        this.logger.log(`Reputation recomputed for store ${storeId}: avg=${averageRating} count=${totalReviews}`);
        return reputation;
    }
    async getStoreReputation(storeId) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { reputationStats: true, ratingAvg: true, ratingCount: true },
        });
        if (!store) {
            return this.emptyReputation();
        }
        if (store.reputationStats && typeof store.reputationStats === 'object') {
            return store.reputationStats;
        }
        return this.recomputeStoreReputation(storeId);
    }
    isOrderReviewable(status) {
        return REVIEWABLE_STATUSES.includes(status);
    }
    async computeOperationalMetrics(storeId) {
        const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const orders = await this.prisma.order.findMany({
            where: { storeId, createdAt: { gte: since } },
            select: {
                status: true,
                delivery: { select: { estimatedMins: true, deliveredAt: true, assignedAt: true } },
            },
        });
        if (orders.length === 0) {
            return [1, 0, 30];
        }
        const fulfilled = orders.filter((o) => o.status === client_1.OrderStatus.DELIVERED || o.status === client_1.OrderStatus.COMPLETED).length;
        const cancelled = orders.filter((o) => String(o.status).startsWith('CANCELLED')).length;
        const fulfillmentRate = fulfilled / orders.length;
        const cancellationRate = cancelled / orders.length;
        const deliveryMins = orders
            .map((o) => o.delivery?.estimatedMins)
            .filter((m) => m != null && m > 0);
        const avgDeliveryMins = deliveryMins.length > 0
            ? deliveryMins.reduce((a, b) => a + b, 0) / deliveryMins.length
            : 30;
        return [fulfillmentRate, cancellationRate, avgDeliveryMins];
    }
    computeRankingScore(input) {
        const ratingComponent = input.averageRating * 20;
        const volumeComponent = Math.min(20, Math.log10(input.totalReviews + 1) * 10);
        const fulfillmentComponent = input.fulfillmentRate * 30;
        const cancellationPenalty = input.cancellationRate * 25;
        const speedComponent = Math.max(0, 15 - input.avgDeliveryMins / 10);
        return Math.round((ratingComponent + volumeComponent + fulfillmentComponent + speedComponent - cancellationPenalty) *
            10) / 10;
    }
    emptyReputation() {
        return {
            averageRating: 0,
            totalReviews: 0,
            distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            distributionPct: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            repeatCustomers: 0,
            responseRate: 0,
            rankingScore: 0,
        };
    }
};
exports.StoreReputationService = StoreReputationService;
exports.StoreReputationService = StoreReputationService = StoreReputationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        buyer_cache_service_1.BuyerCacheService])
], StoreReputationService);
//# sourceMappingURL=store-reputation.service.js.map