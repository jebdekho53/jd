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
exports.SeoAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
let SeoAnalyticsService = class SeoAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordDailySnapshot() {
        const today = (0, ist_day_util_1.startOfIstDay)();
        const [pages, keywords, mentions, faqs, crawlers] = await Promise.all([
            this.prisma.seoPage.count({ where: { indexable: true } }),
            this.prisma.seoKeyword.aggregate({ _sum: { impressions: true, clicks: true } }),
            this.prisma.geoMention.count({ where: { detectedAt: { gte: new Date(Date.now() - 86400000) } } }),
            this.prisma.seoFaq.aggregate({ _avg: { aeoScore: true }, _sum: { impressions: true } }),
            this.prisma.aiCrawlerVisit.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
        ]);
        const impressions = keywords._sum.impressions ?? 0;
        const clicks = keywords._sum.clicks ?? 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const topKeywords = await this.prisma.seoKeyword.findMany({
            orderBy: { impressions: 'desc' },
            take: 20,
            select: { keyword: true, avgPosition: true, impressions: true, clicks: true },
        });
        return this.prisma.seoSnapshot.upsert({
            where: { snapshotDate: today },
            create: {
                snapshotDate: today,
                organicTraffic: crawlers + impressions,
                keywordRankings: topKeywords,
                ctr,
                aiCitations: mentions,
                featuredSnippetWins: await this.prisma.seoFaq.count({ where: { featured: true, clicks: { gt: 0 } } }),
                geoVisibilityScore: Math.min(mentions * 5 + pages * 0.1, 100),
                aeoVisibilityScore: faqs._avg.aeoScore ?? 0,
                metadata: { indexedPages: pages, crawlerVisits24h: crawlers },
            },
            update: {
                organicTraffic: crawlers + impressions,
                keywordRankings: topKeywords,
                ctr,
                aiCitations: mentions,
                geoVisibilityScore: Math.min(mentions * 5 + pages * 0.1, 100),
                aeoVisibilityScore: faqs._avg.aeoScore ?? 0,
                metadata: { indexedPages: pages, crawlerVisits24h: crawlers },
            },
        });
    }
    async getAdminOverview() {
        const [indexedPages, sitemaps, keywords, snapshots, crawlHealth] = await Promise.all([
            this.prisma.seoPage.count({ where: { indexable: true } }),
            this.prisma.sitemapIndex.findMany(),
            this.prisma.seoKeyword.findMany({ orderBy: { impressions: 'desc' }, take: 10 }),
            this.prisma.seoSnapshot.findMany({ orderBy: { snapshotDate: 'desc' }, take: 7 }),
            this.prisma.aiCrawlerVisit.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
        ]);
        const latest = snapshots[0];
        return {
            indexedPages,
            sitemapStatus: sitemaps.map((s) => ({
                type: s.sitemapType,
                urlCount: s.urlCount,
                lastGeneratedAt: s.lastGeneratedAt,
            })),
            topKeywords: keywords,
            crawlHealth: { visits24h: crawlHealth },
            metrics: {
                organicTraffic: latest?.organicTraffic ?? 0,
                ctr: latest?.ctr ?? 0,
                aiCitations: latest?.aiCitations ?? 0,
                geoVisibilityScore: latest?.geoVisibilityScore ?? 0,
                aeoVisibilityScore: latest?.aeoVisibilityScore ?? 0,
            },
            trend: snapshots,
        };
    }
    async getMerchantOverview(storeId) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { name: true, slug: true, ratingAvg: true, ratingCount: true, description: true, logoUrl: true },
        });
        if (!store)
            return null;
        const keywords = await this.prisma.seoKeyword.findMany({
            where: { storeId },
            orderBy: { impressions: 'desc' },
            take: 10,
        });
        const impressions = keywords.reduce((s, k) => s + k.impressions, 0);
        const missingMeta = [];
        if (!store.description)
            missingMeta.push('store_description');
        if (!store.logoUrl)
            missingMeta.push('logo');
        const visibilityScore = Math.min(40 + store.ratingAvg * 10 + keywords.length * 3 + (store.description ? 10 : 0), 100);
        return {
            store,
            visibilityScore,
            searchImpressions: impressions,
            topKeywords: keywords,
            missingMetadata: missingMeta,
            recommendations: this.buildRecommendations(missingMeta, keywords.length),
        };
    }
    buildRecommendations(missing, keywordCount) {
        const recs = [];
        if (missing.includes('store_description'))
            recs.push('Add a detailed store description for better search visibility.');
        if (missing.includes('logo'))
            recs.push('Upload a high-quality store logo.');
        if (keywordCount < 3)
            recs.push('Consider retail media ads to boost keyword coverage.');
        if (recs.length === 0)
            recs.push('Store SEO looks healthy — maintain ratings and product catalog freshness.');
        return recs;
    }
    async trackSearchKeyword(keyword, storeId) {
        if (!keyword.trim())
            return;
        const existing = await this.prisma.seoKeyword.findFirst({
            where: { keyword: keyword.toLowerCase(), storeId: storeId ?? null },
            orderBy: { trackedAt: 'desc' },
        });
        if (existing) {
            return this.prisma.seoKeyword.update({
                where: { id: existing.id },
                data: { impressions: { increment: 1 }, trackedAt: new Date() },
            });
        }
        return this.prisma.seoKeyword.create({
            data: { keyword: keyword.toLowerCase(), storeId, impressions: 1 },
        });
    }
};
exports.SeoAnalyticsService = SeoAnalyticsService;
exports.SeoAnalyticsService = SeoAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SeoAnalyticsService);
//# sourceMappingURL=seo-analytics.service.js.map