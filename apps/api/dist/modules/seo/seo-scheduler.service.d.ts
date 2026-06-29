import { OnModuleInit } from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import { ProgrammaticPageService } from './programmatic-page.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { FaqEngineService } from './faq-engine.service';
import { SeoAnalyticsService } from './seo-analytics.service';
export declare class SeoSchedulerService implements OnModuleInit {
    private readonly sitemap;
    private readonly pages;
    private readonly knowledge;
    private readonly faq;
    private readonly analytics;
    private readonly logger;
    constructor(sitemap: SitemapService, pages: ProgrammaticPageService, knowledge: KnowledgeGraphService, faq: FaqEngineService, analytics: SeoAnalyticsService);
    onModuleInit(): void;
    refreshSeoAssets(): Promise<void>;
}
