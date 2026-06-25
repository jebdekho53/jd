import { Module } from '@nestjs/common';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';
import { SitemapService } from './sitemap.service';
import { ProgrammaticPageService } from './programmatic-page.service';
import { SchemaMarkupService } from './schema-markup.service';
import { FaqEngineService } from './faq-engine.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { AiCrawlerAnalyticsService } from './ai-crawler-analytics.service';
import { SeoAnalyticsService } from './seo-analytics.service';
import { SeoSchedulerService } from './seo-scheduler.service';
import { LlmsTxtService } from './llms-txt.service';
import { PublicSeoController, PublicKnowledgeController } from './public-seo.controller';
import { AdminSeoController } from './admin-seo.controller';
import { MerchantSeoController } from './merchant-seo.controller';

@Module({
  imports: [MerchantDashboardModule],
  controllers: [PublicSeoController, PublicKnowledgeController, AdminSeoController, MerchantSeoController],
  providers: [
    SitemapService,
    ProgrammaticPageService,
    SchemaMarkupService,
    FaqEngineService,
    KnowledgeGraphService,
    AiCrawlerAnalyticsService,
    SeoAnalyticsService,
    SeoSchedulerService,
    LlmsTxtService,
  ],
  exports: [
    SitemapService,
    ProgrammaticPageService,
    SchemaMarkupService,
    KnowledgeGraphService,
    SeoAnalyticsService,
    AiCrawlerAnalyticsService,
  ],
})
export class SeoModule {}
