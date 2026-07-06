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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgrammaticPageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const seo_util_1 = require("./seo.util");
let ProgrammaticPageService = class ProgrammaticPageService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.siteUrl = config.get('BUYER_SITE_URL', 'https://jebdekho.com');
    }
    async syncAll() {
        let count = 0;
        count += await this.syncCityPages();
        count += await this.syncCityCategoryPages();
        count += await this.syncStorePages();
        count += await this.syncCategoryPages();
        count += await this.syncBrandPages();
        return count;
    }
    async getPageByPath(path) {
        return this.prisma.seoPage.findUnique({
            where: { path },
            include: { city: true, category: true, store: true, faqs: { where: { featured: true }, take: 10 } },
        });
    }
    async upsertPage(data) {
        return this.prisma.seoPage.upsert({
            where: { path: data.path },
            create: {
                ...data,
                canonicalUrl: (0, seo_util_1.absoluteUrl)(data.path, this.siteUrl),
                indexable: true,
            },
            update: {
                title: data.title,
                description: data.description,
                h1: data.h1,
                canonicalUrl: (0, seo_util_1.absoluteUrl)(data.path, this.siteUrl),
                indexable: true,
            },
        });
    }
    async syncCityPages() {
        const cities = await this.prisma.city.findMany({ where: { isActive: true } });
        for (const city of cities) {
            const path = `/city/${city.slug}`;
            await this.upsertPage({
                slug: `city-${city.slug}`,
                path,
                pageType: client_1.SeoPageType.CITY,
                title: `Hyperlocal delivery in ${city.name} | JebDekho`,
                description: `Order groceries, essentials, and more with fast delivery in ${city.name}, ${city.state}. Discover local stores on JebDekho.`,
                h1: `Delivery in ${city.name}`,
                cityId: city.id,
                entityType: 'city',
                entityId: city.id,
            });
        }
        return cities.length;
    }
    async syncCityCategoryPages() {
        const cities = await this.prisma.city.findMany({ where: { isActive: true } });
        const categories = await this.prisma.category.findMany({
            where: { isActive: true, deletedAt: null, scope: client_1.CategoryScope.GLOBAL, storeId: null },
            take: 200,
        });
        let count = 0;
        for (const city of cities) {
            for (const cat of categories) {
                const path = `/city/${city.slug}/${cat.slug}`;
                await this.upsertPage({
                    slug: `city-${city.slug}-${cat.slug}`,
                    path,
                    pageType: client_1.SeoPageType.CITY_CATEGORY,
                    title: `${cat.name} delivery in ${city.name} | JebDekho`,
                    description: `Buy ${cat.name} online in ${city.name} with fast hyperlocal delivery from trusted local stores.`,
                    h1: `${cat.name} in ${city.name}`,
                    cityId: city.id,
                    categoryId: cat.id,
                    entityType: 'city_category',
                    entityId: `${city.id}:${cat.id}`,
                });
                count++;
            }
        }
        return count;
    }
    async syncStorePages() {
        const stores = await this.prisma.store.findMany({
            where: { isActive: true, deletedAt: null, status: client_1.StoreStatus.APPROVED },
            include: { city: true },
            take: 2000,
        });
        for (const store of stores) {
            const path = `/store/${store.slug}`;
            await this.upsertPage({
                slug: `store-${store.slug}`,
                path,
                pageType: client_1.SeoPageType.STORE,
                title: `${store.name} — Order online | JebDekho`,
                description: `Order from ${store.name} in ${store.city?.name ?? 'your city'} with fast delivery on JebDekho.`,
                h1: store.name,
                storeId: store.id,
                cityId: store.cityId,
                entityType: 'store',
                entityId: store.id,
            });
        }
        return stores.length;
    }
    async syncCategoryPages() {
        const categories = await this.prisma.category.findMany({
            where: { isActive: true, deletedAt: null, scope: client_1.CategoryScope.GLOBAL, storeId: null },
        });
        for (const cat of categories) {
            const path = `/category/${cat.slug}`;
            await this.upsertPage({
                slug: `category-${cat.slug}`,
                path,
                pageType: client_1.SeoPageType.CATEGORY,
                title: `Shop ${cat.name} online | JebDekho`,
                description: cat.description ?? `Browse ${cat.name} from hyperlocal stores near you on JebDekho.`,
                h1: cat.name,
                categoryId: cat.id,
                entityType: 'category',
                entityId: cat.id,
            });
        }
        return categories.length;
    }
    async syncBrandPages() {
        const brands = await this.prisma.product.groupBy({
            by: ['brand'],
            where: { isActive: true, deletedAt: null, brand: { not: null } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 500,
        });
        let count = 0;
        for (const row of brands) {
            if (!row.brand)
                continue;
            const brandSlug = (0, seo_util_1.slugify)(row.brand);
            const path = `/brand/${brandSlug}`;
            await this.upsertPage({
                slug: `brand-${brandSlug}`,
                path,
                pageType: client_1.SeoPageType.BRAND,
                title: `${row.brand} products | JebDekho`,
                description: `Shop ${row.brand} products from local stores with fast delivery on JebDekho.`,
                h1: row.brand,
                brandSlug,
                entityType: 'brand',
                entityId: brandSlug,
            });
            count++;
        }
        return count;
    }
};
exports.ProgrammaticPageService = ProgrammaticPageService;
exports.ProgrammaticPageService = ProgrammaticPageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], ProgrammaticPageService);
//# sourceMappingURL=programmatic-page.service.js.map