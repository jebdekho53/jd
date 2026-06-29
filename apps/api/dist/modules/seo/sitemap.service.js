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
exports.SitemapService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const seo_util_1 = require("./seo.util");
let SitemapService = class SitemapService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.siteUrl = config.get('BUYER_SITE_URL', 'https://jebdekho.com');
    }
    async generateAll() {
        await Promise.all([
            this.generateType(client_1.SitemapType.PRODUCTS, () => this.buildProductsXml()),
            this.generateType(client_1.SitemapType.STORES, () => this.buildStoresXml()),
            this.generateType(client_1.SitemapType.CATEGORIES, () => this.buildCategoriesXml()),
            this.generateType(client_1.SitemapType.CITIES, () => this.buildCitiesXml()),
            this.generateType(client_1.SitemapType.FAQ, () => this.buildFaqXml()),
            this.generateType(client_1.SitemapType.INDEX, () => this.buildIndexXml()),
        ]);
    }
    async getBrandsXml() {
        const brands = await this.prisma.seoPage.findMany({
            where: { pageType: 'BRAND', indexable: true },
            select: { path: true, updatedAt: true },
            take: 5000,
        });
        const urls = brands.map((b) => ({
            loc: (0, seo_util_1.absoluteUrl)(b.path, this.siteUrl),
            lastmod: b.updatedAt.toISOString(),
        }));
        return this.wrapUrlset(urls);
    }
    async getXml(type) {
        const row = await this.prisma.sitemapIndex.findUnique({ where: { sitemapType: type } });
        if (row?.xmlContent)
            return row.xmlContent;
        await this.generateAll();
        const refreshed = await this.prisma.sitemapIndex.findUnique({ where: { sitemapType: type } });
        return refreshed?.xmlContent ?? this.emptyUrlset();
    }
    async generateType(type, builder) {
        const { xml, count } = await builder();
        const fileName = type === client_1.SitemapType.INDEX ? 'sitemap.xml' : `sitemap-${type.toLowerCase()}.xml`;
        await this.prisma.sitemapIndex.upsert({
            where: { sitemapType: type },
            create: {
                sitemapType: type,
                url: (0, seo_util_1.absoluteUrl)(`/${fileName}`, this.siteUrl),
                lastGeneratedAt: new Date(),
                urlCount: count,
                xmlContent: xml,
            },
            update: {
                url: (0, seo_util_1.absoluteUrl)(`/${fileName}`, this.siteUrl),
                lastGeneratedAt: new Date(),
                urlCount: count,
                xmlContent: xml,
            },
        });
    }
    async buildIndexXml() {
        const children = ['products', 'stores', 'categories', 'cities', 'faq', 'brands'];
        const urls = children.map((c) => ({
            loc: (0, seo_util_1.absoluteUrl)(`/sitemap-${c}.xml`, this.siteUrl),
            lastmod: new Date().toISOString(),
        }));
        return { xml: this.wrapSitemapIndex(urls), count: urls.length };
    }
    async buildProductsXml() {
        const products = await this.prisma.product.findMany({
            where: { isActive: true, deletedAt: null },
            select: { id: true, slug: true, updatedAt: true, store: { select: { slug: true } } },
            take: 5000,
            orderBy: { updatedAt: 'desc' },
        });
        const urls = products.map((p) => ({
            loc: (0, seo_util_1.absoluteUrl)(`/products/${p.id}`, this.siteUrl),
            lastmod: p.updatedAt.toISOString(),
        }));
        return { xml: this.wrapUrlset(urls), count: urls.length };
    }
    async buildStoresXml() {
        const stores = await this.prisma.store.findMany({
            where: { isActive: true, deletedAt: null, status: 'APPROVED' },
            select: { slug: true, updatedAt: true },
            take: 5000,
        });
        const urls = stores.flatMap((s) => [
            { loc: (0, seo_util_1.absoluteUrl)(`/stores/${s.slug}`, this.siteUrl), lastmod: s.updatedAt.toISOString() },
            { loc: (0, seo_util_1.absoluteUrl)(`/store/${s.slug}`, this.siteUrl), lastmod: s.updatedAt.toISOString() },
        ]);
        return { xml: this.wrapUrlset(urls), count: urls.length };
    }
    async buildCategoriesXml() {
        const categories = await this.prisma.category.findMany({
            where: { isActive: true, deletedAt: null, scope: 'GLOBAL', storeId: null },
            select: { slug: true, updatedAt: true },
            take: 2000,
        });
        const urls = categories.flatMap((c) => [
            { loc: (0, seo_util_1.absoluteUrl)(`/categories/${c.slug}`, this.siteUrl), lastmod: c.updatedAt.toISOString() },
            { loc: (0, seo_util_1.absoluteUrl)(`/category/${c.slug}`, this.siteUrl), lastmod: c.updatedAt.toISOString() },
        ]);
        return { xml: this.wrapUrlset(urls), count: urls.length };
    }
    async buildCitiesXml() {
        const [cities, pages] = await Promise.all([
            this.prisma.city.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
            this.prisma.seoPage.findMany({
                where: { pageType: { in: ['CITY', 'CITY_CATEGORY'] }, indexable: true },
                select: { path: true, updatedAt: true },
            }),
        ]);
        const urls = [
            ...cities.map((c) => ({
                loc: (0, seo_util_1.absoluteUrl)(`/city/${c.slug}`, this.siteUrl),
                lastmod: c.updatedAt.toISOString(),
            })),
            ...pages.map((p) => ({
                loc: (0, seo_util_1.absoluteUrl)(p.path, this.siteUrl),
                lastmod: p.updatedAt.toISOString(),
            })),
        ];
        return { xml: this.wrapUrlset(urls), count: urls.length };
    }
    async buildFaqXml() {
        const faqs = await this.prisma.seoFaq.findMany({ select: { slug: true, updatedAt: true }, take: 500 });
        const urls = [
            { loc: (0, seo_util_1.absoluteUrl)('/faq', this.siteUrl), lastmod: new Date().toISOString() },
            ...faqs.map((f) => ({
                loc: (0, seo_util_1.absoluteUrl)(`/faq#${f.slug}`, this.siteUrl),
                lastmod: f.updatedAt.toISOString(),
            })),
        ];
        return { xml: this.wrapUrlset(urls), count: urls.length };
    }
    wrapUrlset(urls) {
        const body = urls
            .map((u) => `  <url><loc>${this.escape(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`)
            .join('\n');
        return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
    }
    wrapSitemapIndex(urls) {
        const body = urls
            .map((u) => `  <sitemap><loc>${this.escape(u.loc)}</loc><lastmod>${u.lastmod}</lastmod></sitemap>`)
            .join('\n');
        return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
    }
    emptyUrlset() {
        return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    }
    escape(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
};
exports.SitemapService = SitemapService;
exports.SitemapService = SitemapService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], SitemapService);
//# sourceMappingURL=sitemap.service.js.map