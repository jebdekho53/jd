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
exports.KnowledgeGraphService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const seo_util_1 = require("./seo.util");
let KnowledgeGraphService = class KnowledgeGraphService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async syncEntities() {
        let count = 0;
        count += await this.syncPlatform();
        count += await this.syncPlus();
        count += await this.syncCities();
        count += await this.syncCategories();
        count += await this.syncStores();
        count += await this.syncBrands();
        return count;
    }
    async getPublicKnowledge() {
        const [cities, stores, categories, faqs, entities] = await Promise.all([
            this.prisma.city.findMany({
                where: { isActive: true },
                select: { id: true, name: true, slug: true, state: true, latitude: true, longitude: true },
                take: 100,
            }),
            this.prisma.store.findMany({
                where: { isActive: true, status: client_1.StoreStatus.APPROVED, deletedAt: null },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    ratingAvg: true,
                    ratingCount: true,
                    city: { select: { name: true, slug: true } },
                },
                take: 200,
            }),
            this.prisma.category.findMany({
                where: { isActive: true, scope: client_1.CategoryScope.GLOBAL, storeId: null, deletedAt: null },
                select: { id: true, name: true, slug: true, description: true },
                take: 100,
            }),
            this.prisma.seoFaq.findMany({
                where: { featured: true },
                select: { question: true, answer: true, slug: true },
                take: 50,
            }),
            this.prisma.seoEntity.findMany({
                orderBy: { coverageScore: 'desc' },
                take: 100,
            }),
        ]);
        const brands = await this.prisma.product.groupBy({
            by: ['brand'],
            where: { isActive: true, brand: { not: null } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 50,
        });
        return {
            platform: { name: 'JebDekho', description: 'Hyperlocal commerce marketplace for India' },
            plus: { name: 'JebDekho Plus', benefits: ['FREE_DELIVERY', 'EXTRA_REWARDS', 'VIP_SUPPORT'] },
            cities,
            stores,
            categories,
            brands: brands.filter((b) => b.brand).map((b) => ({ name: b.brand, productCount: b._count.id })),
            faqs,
            entities,
            deliveryCoverage: cities.map((c) => ({ city: c.name, slug: c.slug, state: c.state })),
            generatedAt: new Date().toISOString(),
        };
    }
    async upsertEntity(data) {
        return this.prisma.seoEntity.upsert({
            where: { entityType_slug: { entityType: data.entityType, slug: data.slug } },
            create: {
                entityType: data.entityType,
                entityId: data.entityId,
                name: data.name,
                slug: data.slug,
                description: data.description,
                relations: data.relations ?? [],
                knowledgeJson: data.knowledgeJson,
                coverageScore: data.coverageScore ?? 50,
            },
            update: {
                name: data.name,
                description: data.description,
                relations: data.relations ?? [],
                knowledgeJson: data.knowledgeJson,
                coverageScore: data.coverageScore ?? 50,
            },
        });
    }
    async syncPlatform() {
        await this.upsertEntity({
            entityType: client_1.SeoEntityType.PLATFORM,
            name: 'JebDekho',
            slug: 'jebdekho',
            description: 'Hyperlocal marketplace for groceries, essentials, and more.',
            coverageScore: 100,
            knowledgeJson: { type: 'commerce_platform', country: 'IN' },
        });
        return 1;
    }
    async syncPlus() {
        await this.upsertEntity({
            entityType: client_1.SeoEntityType.PLUS,
            name: 'JebDekho Plus',
            slug: 'jebdekho-plus',
            description: 'Membership with free delivery, extra rewards, and VIP support.',
            coverageScore: 90,
            relations: [{ type: 'PLATFORM', slug: 'jebdekho' }],
        });
        return 1;
    }
    async syncCities() {
        const cities = await this.prisma.city.findMany({ where: { isActive: true } });
        for (const city of cities) {
            await this.upsertEntity({
                entityType: client_1.SeoEntityType.CITY,
                entityId: city.id,
                name: city.name,
                slug: city.slug,
                description: `Delivery coverage in ${city.name}, ${city.state}`,
                coverageScore: 70,
                knowledgeJson: { lat: city.latitude, lng: city.longitude },
            });
        }
        return cities.length;
    }
    async syncCategories() {
        const categories = await this.prisma.category.findMany({
            where: { isActive: true, scope: client_1.CategoryScope.GLOBAL, storeId: null, deletedAt: null },
        });
        for (const cat of categories) {
            await this.upsertEntity({
                entityType: client_1.SeoEntityType.CATEGORY,
                entityId: cat.id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description ?? undefined,
                coverageScore: 65,
            });
        }
        return categories.length;
    }
    async syncStores() {
        const stores = await this.prisma.store.findMany({
            where: { isActive: true, status: client_1.StoreStatus.APPROVED, deletedAt: null },
            include: { city: true, merchantProfile: true },
            take: 500,
        });
        for (const store of stores) {
            await this.upsertEntity({
                entityType: client_1.SeoEntityType.STORE,
                entityId: store.id,
                name: store.name,
                slug: store.slug,
                description: `${store.name} in ${store.city?.name ?? 'India'}`,
                coverageScore: 60 + Math.min(store.ratingAvg * 5, 30),
                relations: (store.city ? [{ type: 'CITY', slug: store.city.slug }] : []),
                knowledgeJson: { ratingAvg: store.ratingAvg, merchantId: store.merchantProfileId },
            });
        }
        return stores.length;
    }
    async syncBrands() {
        const brands = await this.prisma.product.groupBy({
            by: ['brand'],
            where: { isActive: true, brand: { not: null } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 200,
        });
        let count = 0;
        for (const row of brands) {
            if (!row.brand)
                continue;
            await this.upsertEntity({
                entityType: client_1.SeoEntityType.BRAND,
                name: row.brand,
                slug: (0, seo_util_1.slugify)(row.brand),
                description: `${row.brand} products available on JebDekho`,
                coverageScore: Math.min(40 + row._count.id, 95),
                knowledgeJson: { productCount: row._count.id },
            });
            count++;
        }
        return count;
    }
    async getGeoMetrics() {
        const [entities, mentions, coverage] = await Promise.all([
            this.prisma.seoEntity.count(),
            this.prisma.geoMention.groupBy({ by: ['engine'], _count: { id: true } }),
            this.prisma.seoEntity.aggregate({ _avg: { coverageScore: true } }),
        ]);
        return {
            entityCount: entities,
            avgCoverage: coverage._avg.coverageScore ?? 0,
            citationsByEngine: mentions,
        };
    }
};
exports.KnowledgeGraphService = KnowledgeGraphService;
exports.KnowledgeGraphService = KnowledgeGraphService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KnowledgeGraphService);
//# sourceMappingURL=knowledge-graph.service.js.map