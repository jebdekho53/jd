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
var SearchAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let SearchAnalyticsService = SearchAnalyticsService_1 = class SearchAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SearchAnalyticsService_1.name);
    }
    track(input) {
        void this.prisma.searchEvent
            .create({
            data: {
                eventType: input.eventType,
                query: input.query?.slice(0, 200),
                buyerProfileId: input.buyerProfileId,
                sessionId: input.sessionId,
                productId: input.productId,
                storeId: input.storeId,
                categoryId: input.categoryId,
                lat: input.lat,
                lng: input.lng,
                metadata: input.metadata,
            },
        })
            .catch((err) => this.logger.warn(`Search event track failed: ${err.message}`));
    }
    sinceForPeriod(period) {
        const ms = period === '24h' ? 86_400_000 : period === '7d' ? 7 * 86_400_000 : 30 * 86_400_000;
        return new Date(Date.now() - ms);
    }
    async getTrendingQueries(period, limit = 10) {
        const since = this.sinceForPeriod(period);
        const rows = await this.prisma.searchEvent.groupBy({
            by: ['query'],
            where: {
                eventType: { in: [client_1.SearchEventType.QUERY, client_1.SearchEventType.CLICK] },
                query: { not: null },
                createdAt: { gte: since },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: limit,
        });
        return rows
            .filter((r) => r.query)
            .map((r) => ({ query: r.query, count: r._count.id }));
    }
    async getAdminAnalytics(period = '7d') {
        const since = this.sinceForPeriod(period);
        const [topSearches, noResults, queries, clicks, orders] = await Promise.all([
            this.getTrendingQueries(period, 20),
            this.prisma.searchEvent.groupBy({
                by: ['query'],
                where: { eventType: client_1.SearchEventType.NO_RESULT, createdAt: { gte: since }, query: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 15,
            }),
            this.prisma.searchEvent.count({ where: { eventType: client_1.SearchEventType.QUERY, createdAt: { gte: since } } }),
            this.prisma.searchEvent.count({ where: { eventType: client_1.SearchEventType.CLICK, createdAt: { gte: since } } }),
            this.prisma.searchEvent.count({ where: { eventType: client_1.SearchEventType.ORDER, createdAt: { gte: since } } }),
        ]);
        const lowConversion = topSearches
            .map((t) => ({ query: t.query, searches: t.count }))
            .slice(0, 10);
        const trendingCategories = await this.prisma.searchEvent.groupBy({
            by: ['categoryId'],
            where: { categoryId: { not: null }, createdAt: { gte: since } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });
        const categoryNames = await this.prisma.category.findMany({
            where: { id: { in: trendingCategories.map((c) => c.categoryId).filter(Boolean) } },
            select: { id: true, name: true },
        });
        const catMap = new Map(categoryNames.map((c) => [c.id, c.name]));
        const trendingStores = await this.prisma.searchEvent.groupBy({
            by: ['storeId'],
            where: { storeId: { not: null }, createdAt: { gte: since } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });
        const storeNames = await this.prisma.store.findMany({
            where: { id: { in: trendingStores.map((s) => s.storeId).filter(Boolean) } },
            select: { id: true, name: true },
        });
        const storeMap = new Map(storeNames.map((s) => [s.id, s.name]));
        return {
            period,
            topSearches,
            noResultSearches: noResults.map((r) => ({ query: r.query, count: r._count.id })),
            lowConversionSearches: lowConversion,
            conversionRate: queries > 0 ? Math.round((orders / queries) * 1000) / 10 : 0,
            clickThroughRate: queries > 0 ? Math.round((clicks / queries) * 1000) / 10 : 0,
            trendingCategories: trendingCategories.map((c) => ({
                categoryId: c.categoryId,
                name: catMap.get(c.categoryId) ?? 'Category',
                count: c._count.id,
            })),
            trendingStores: trendingStores.map((s) => ({
                storeId: s.storeId,
                name: storeMap.get(s.storeId) ?? 'Store',
                count: s._count.id,
            })),
        };
    }
    async getMerchantInsights(storeId, period = '7d') {
        const since = this.sinceForPeriod(period);
        const [impressions, clicks, addToCart, orders, topQueries] = await Promise.all([
            this.prisma.searchEvent.count({
                where: { storeId, eventType: client_1.SearchEventType.IMPRESSION, createdAt: { gte: since } },
            }),
            this.prisma.searchEvent.count({
                where: { storeId, eventType: client_1.SearchEventType.CLICK, createdAt: { gte: since } },
            }),
            this.prisma.searchEvent.count({
                where: { storeId, eventType: client_1.SearchEventType.ADD_TO_CART, createdAt: { gte: since } },
            }),
            this.prisma.searchEvent.count({
                where: { storeId, eventType: client_1.SearchEventType.ORDER, createdAt: { gte: since } },
            }),
            this.prisma.searchEvent.groupBy({
                by: ['query'],
                where: {
                    storeId,
                    query: { not: null },
                    eventType: { in: [client_1.SearchEventType.QUERY, client_1.SearchEventType.CLICK] },
                    createdAt: { gte: since },
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
        ]);
        const lostSearches = await this.prisma.searchEvent.groupBy({
            by: ['query'],
            where: {
                storeId,
                eventType: client_1.SearchEventType.NO_RESULT,
                createdAt: { gte: since },
                query: { not: null },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });
        return {
            period,
            impressions,
            clicks,
            ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0,
            addToCart,
            orders,
            conversionRate: clicks > 0 ? Math.round((orders / clicks) * 1000) / 10 : 0,
            topSearchedProducts: topQueries.map((q) => ({ query: q.query, count: q._count.id })),
            lostSearches: lostSearches.map((q) => ({ query: q.query, count: q._count.id })),
        };
    }
};
exports.SearchAnalyticsService = SearchAnalyticsService;
exports.SearchAnalyticsService = SearchAnalyticsService = SearchAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchAnalyticsService);
//# sourceMappingURL=search-analytics.service.js.map