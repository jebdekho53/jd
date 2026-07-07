import { PrismaService } from '../../database/prisma.service';
import { SeoAnalyticsService } from './seo-analytics.service';
import { FaqEngineService } from './faq-engine.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { AiCrawlerAnalyticsService } from './ai-crawler-analytics.service';
export declare class AdminSeoController {
    private readonly prisma;
    private readonly analytics;
    private readonly faq;
    private readonly knowledge;
    private readonly crawlers;
    constructor(prisma: PrismaService, analytics: SeoAnalyticsService, faq: FaqEngineService, knowledge: KnowledgeGraphService, crawlers: AiCrawlerAnalyticsService);
    overview(): Promise<{
        success: boolean;
        data: {
            seo: {
                indexedPages: number;
                sitemapStatus: {
                    type: import("@prisma/client").$Enums.SitemapType;
                    urlCount: number;
                    lastGeneratedAt: Date;
                }[];
                topKeywords: {
                    id: string;
                    createdAt: Date;
                    storeId: string | null;
                    impressions: number;
                    clicks: number;
                    keyword: string;
                    ctr: number;
                    pageId: string | null;
                    avgPosition: number | null;
                    trackedAt: Date;
                }[];
                crawlHealth: {
                    visits24h: number;
                };
                metrics: {
                    organicTraffic: number;
                    ctr: number;
                    aiCitations: number;
                    geoVisibilityScore: number;
                    aeoVisibilityScore: number;
                };
                trend: {
                    id: string;
                    metadata: import("@prisma/client/runtime/library").JsonValue | null;
                    createdAt: Date;
                    snapshotDate: Date;
                    ctr: number;
                    organicTraffic: number;
                    keywordRankings: import("@prisma/client/runtime/library").JsonValue;
                    aiCitations: number;
                    featuredSnippetWins: number;
                    geoVisibilityScore: number;
                    aeoVisibilityScore: number;
                }[];
            };
            aeo: {
                total: number;
                featured: number;
                avgAeoScore: number;
                topFaqs: {
                    category: string | null;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    cityId: string | null;
                    slug: string;
                    impressions: number;
                    clicks: number;
                    pageId: string | null;
                    question: string;
                    answer: string;
                    featured: boolean;
                    aeoScore: number;
                }[];
            };
            geo: {
                entityCount: number;
                avgCoverage: number;
                citationsByEngine: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.GeoMentionGroupByOutputType, "engine"[]> & {
                    _count: {
                        id: number;
                    };
                })[];
            };
            technical: {
                visitsLast24h: number;
                activeAiEngines: number;
                health: string;
            };
        };
    }>;
    pages(): Promise<{
        success: boolean;
        data: {
            path: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            storeId: string | null;
            title: string;
            categoryId: string | null;
            cityId: string | null;
            slug: string;
            entityType: string | null;
            entityId: string | null;
            pageType: import("@prisma/client").$Enums.SeoPageType;
            h1: string | null;
            canonicalUrl: string | null;
            brandSlug: string | null;
            metaJson: import("@prisma/client/runtime/library").JsonValue | null;
            indexable: boolean;
        }[];
    }>;
    entities(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            slug: string;
            entityType: import("@prisma/client").$Enums.SeoEntityType;
            entityId: string | null;
            relations: import("@prisma/client/runtime/library").JsonValue;
            knowledgeJson: import("@prisma/client/runtime/library").JsonValue | null;
            coverageScore: number;
        }[];
    }>;
    citations(): Promise<{
        success: boolean;
        data: {
            query: string;
            id: string;
            entityType: string | null;
            entityId: string | null;
            engine: import("@prisma/client").$Enums.GeoMentionEngine;
            citedUrl: string | null;
            sentiment: string | null;
            mentionText: string | null;
            detectedAt: Date;
        }[];
    }>;
    keywords(): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            storeId: string | null;
            impressions: number;
            clicks: number;
            keyword: string;
            ctr: number;
            pageId: string | null;
            avgPosition: number | null;
            trackedAt: Date;
        }[];
    }>;
}
