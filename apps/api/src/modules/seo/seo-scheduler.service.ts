import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SitemapService } from './sitemap.service';
import { ProgrammaticPageService } from './programmatic-page.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { FaqEngineService } from './faq-engine.service';
import { SeoAnalyticsService } from './seo-analytics.service';

@Injectable()
export class SeoSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SeoSchedulerService.name);

  constructor(
    private readonly sitemap: SitemapService,
    private readonly pages: ProgrammaticPageService,
    private readonly knowledge: KnowledgeGraphService,
    private readonly faq: FaqEngineService,
    private readonly analytics: SeoAnalyticsService,
  ) {}

  onModuleInit() {
    void this.refreshSeoAssets();
  }

  /** Refresh sitemaps and programmatic pages every 6 hours */
  @Cron('0 */6 * * *')
  async refreshSeoAssets() {
    this.logger.log('Starting SEO refresh (sitemaps, pages, knowledge graph)');
    try {
      await this.faq.seedDefaultFaqs();
      const pageCount = await this.pages.syncAll();
      const entityCount = await this.knowledge.syncEntities();
      await this.sitemap.generateAll();
      await this.analytics.recordDailySnapshot();
      this.logger.log(`SEO refresh complete: ${pageCount} pages, ${entityCount} entities`);
    } catch (err) {
      this.logger.error({ err }, 'SEO refresh failed');
    }
  }
}
