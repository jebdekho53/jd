import type { Request } from 'express';
import { SitemapService } from './sitemap.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { LlmsTxtService } from './llms-txt.service';
import { ProgrammaticPageService } from './programmatic-page.service';
import { SchemaMarkupService } from './schema-markup.service';
import { AiCrawlerAnalyticsService } from './ai-crawler-analytics.service';
import { FaqEngineService } from './faq-engine.service';
export declare class PublicSeoController {
    private readonly sitemap;
    private readonly llms;
    private readonly crawlers;
    constructor(sitemap: SitemapService, llms: LlmsTxtService, crawlers: AiCrawlerAnalyticsService);
    sitemapIndex(req: Request): Promise<string>;
    sitemapProducts(req: Request): Promise<string>;
    sitemapStores(req: Request): Promise<string>;
    sitemapCategories(req: Request): Promise<string>;
    sitemapCities(req: Request): Promise<string>;
    sitemapFaq(req: Request): Promise<string>;
    sitemapBrands(req: Request): Promise<string>;
    robots(req: Request): string;
    llmsTxt(req: Request): string;
    private trackCrawler;
}
export declare class PublicKnowledgeController {
    private readonly knowledgeGraph;
    private readonly faq;
    private readonly schema;
    private readonly pages;
    private readonly crawlers;
    constructor(knowledgeGraph: KnowledgeGraphService, faq: FaqEngineService, schema: SchemaMarkupService, pages: ProgrammaticPageService, crawlers: AiCrawlerAnalyticsService);
    knowledge(req: Request): Promise<{
        success: boolean;
        data: {
            schema: {
                organization: {
                    '@context': string;
                    '@type': string;
                    name: string;
                    url: string;
                    logo: string;
                    sameAs: never[];
                };
                webSite: {
                    '@context': string;
                    '@type': string;
                    name: string;
                    url: string;
                    potentialAction: {
                        '@type': string;
                        target: string;
                        'query-input': string;
                    };
                };
                faqPage: {
                    '@context': string;
                    '@type': string;
                    mainEntity: {
                        '@type': string;
                        name: string;
                        acceptedAnswer: {
                            '@type': string;
                            text: string;
                        };
                    }[];
                };
            };
            platform: {
                name: string;
                description: string;
            };
            plus: {
                name: string;
                benefits: string[];
            };
            cities: any;
            stores: any;
            categories: any;
            brands: any;
            faqs: any;
            entities: any;
            deliveryCoverage: any;
            generatedAt: string;
        };
    }>;
    seoPage(path: string, req: Request): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            page: any;
            schemas: Record<string, unknown>[];
            featuredAnswer: {
                answer: any;
                direct: boolean;
                snippet: any;
            } | null;
        };
        message?: undefined;
    }>;
}
