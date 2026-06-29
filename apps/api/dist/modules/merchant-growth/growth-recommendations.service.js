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
exports.GrowthRecommendationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let GrowthRecommendationsService = class GrowthRecommendationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildActionCenter(storeId, health, context) {
        const actions = [];
        if (context.productCount < 20) {
            const gap = 20 - context.productCount;
            actions.push({
                id: 'add-products',
                priority: 'HIGH',
                title: `Add ${gap} more products`,
                description: 'Stores with 20+ active products rank higher in search.',
                expectedImpact: '+15% visibility expected',
                cta: '/products',
            });
        }
        if (context.lowStockSkus > 0) {
            actions.push({
                id: 'restock',
                priority: 'HIGH',
                title: `Low stock on ${context.lowStockSkus} SKUs`,
                description: 'Restock to avoid lost sales and search ranking drops.',
                cta: '/inventory',
            });
        }
        if (health.metrics.cancellationRate > 8) {
            actions.push({
                id: 'reduce-cancellations',
                priority: 'HIGH',
                title: 'Reduce order cancellations',
                description: `Cancellation rate is ${health.metrics.cancellationRate}% — accept orders faster.`,
                cta: '/orders',
            });
        }
        const day = new Date().getDay();
        if ([5, 6, 0].includes(day)) {
            actions.push({
                id: 'weekend-offer',
                priority: 'MEDIUM',
                title: 'Weekend offer recommended',
                description: 'Weekend demand spikes — run a limited-time promotion.',
                expectedImpact: '+10–20% weekend orders',
                cta: '/promotions',
            });
        }
        if (context.hiddenLocalities && context.hiddenLocalities.length > 0) {
            actions.push({
                id: 'expand-localities',
                priority: 'MEDIUM',
                title: `Store hidden in ${context.hiddenLocalities.length} localities`,
                description: `Low visibility in: ${context.hiddenLocalities.slice(0, 3).join(', ')}`,
                cta: '/stores',
            });
        }
        if (health.metrics.repeatCustomerPct < 20) {
            actions.push({
                id: 'retention-campaign',
                priority: 'MEDIUM',
                title: 'Boost repeat customers',
                description: 'Launch a loyalty or win-back campaign for dormant buyers.',
                cta: '/customers',
            });
        }
        if (health.score < 60) {
            actions.push({
                id: 'health-review',
                priority: 'HIGH',
                title: 'Store health needs attention',
                description: 'Review fulfillment, ratings and inventory to improve your score.',
                cta: '/growth',
            });
        }
        return actions.sort((a, b) => {
            const p = { HIGH: 0, MEDIUM: 1, LOW: 2 };
            return p[a.priority] - p[b.priority];
        });
    }
    async buildRecommendations(storeId, health, search) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            include: {
                products: {
                    where: { deletedAt: null, isActive: true },
                    select: { id: true, name: true, categoryId: true },
                    take: 100,
                },
                city: { select: { name: true } },
            },
        });
        if (!store)
            return [];
        const recs = [];
        const nearbyTop = await this.prisma.orderItem.groupBy({
            by: ['productName'],
            where: {
                order: {
                    store: { cityId: store.cityId },
                    storeId: { not: storeId },
                    createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
                    status: { in: ['DELIVERED', 'COMPLETED'] },
                },
            },
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        });
        for (const item of nearbyTop) {
            const has = store.products.some((p) => p.name.toLowerCase().includes(item.productName.toLowerCase().slice(0, 8)));
            if (!has) {
                recs.push({
                    type: 'PRODUCT',
                    title: `Best seller nearby: ${item.productName}`,
                    detail: `${item._sum.quantity ?? 0} units sold by competitors in ${store.city.name}`,
                    impact: 'High demand in your area',
                });
            }
        }
        const storeCategoryIds = new Set(store.products.map((p) => p.categoryId).filter(Boolean));
        const trendingCats = await this.prisma.searchEvent.groupBy({
            by: ['categoryId'],
            where: {
                createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
                categoryId: { not: null },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });
        const missingCats = trendingCats.filter((c) => c.categoryId && !storeCategoryIds.has(c.categoryId));
        if (missingCats.length > 0) {
            const cats = await this.prisma.category.findMany({
                where: { id: { in: missingCats.map((c) => c.categoryId) } },
                select: { name: true },
            });
            for (const cat of cats.slice(0, 3)) {
                recs.push({
                    type: 'CATEGORY',
                    title: `Missing category: ${cat.name}`,
                    detail: 'High search demand — add products in this category.',
                });
            }
        }
        if (health.metrics.cancellationRate < 5 && health.score >= 70) {
            recs.push({
                type: 'DISCOUNT',
                title: 'Suggested discount: 10% off',
                detail: 'Your fulfillment is strong — a modest discount can lift conversion.',
                impact: '+5–12% orders',
            });
        }
        if (store.deliveryRadiusKm < 7) {
            recs.push({
                type: 'RADIUS',
                title: 'Recommended delivery radius: 7 km',
                detail: `Current radius ${store.deliveryRadiusKm} km — expand to capture more demand.`,
            });
        }
        for (const lost of search.lostSearches.slice(0, 3)) {
            recs.push({
                type: 'SEARCH_GAP',
                title: `Lost search: "${lost.query}"`,
                detail: `${lost.count} searches with no matching products in your store.`,
                impact: 'Add or tag products for this query',
            });
        }
        recs.push({
            type: 'COMPETITOR',
            title: 'Competitor intelligence',
            detail: `${nearbyTop.length} top sellers identified in ${store.city.name} — compare pricing and assortment.`,
        });
        return recs;
    }
};
exports.GrowthRecommendationsService = GrowthRecommendationsService;
exports.GrowthRecommendationsService = GrowthRecommendationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GrowthRecommendationsService);
//# sourceMappingURL=growth-recommendations.service.js.map