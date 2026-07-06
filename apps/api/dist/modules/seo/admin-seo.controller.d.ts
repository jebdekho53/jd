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
                indexedPages: any;
                sitemapStatus: any;
                topKeywords: any;
                crawlHealth: {
                    visits24h: any;
                };
                metrics: {
                    organicTraffic: any;
                    ctr: any;
                    aiCitations: any;
                    geoVisibilityScore: any;
                    aeoVisibilityScore: any;
                };
                trend: any;
            };
            aeo: {
                total: any;
                featured: any;
                avgAeoScore: any;
                topFaqs: any;
            };
            geo: {
                entityCount: any;
                avgCoverage: any;
                citationsByEngine: any;
            };
            technical: {
                visitsLast24h: any;
                activeAiEngines: any;
                health: string;
            };
        };
    }>;
    pages(): Promise<{
        success: boolean;
        data: any;
    }>;
    entities(): Promise<{
        success: boolean;
        data: any;
    }>;
    citations(): Promise<{
        success: boolean;
        data: any;
    }>;
    keywords(): Promise<{
        success: boolean;
        data: any;
    }>;
}
