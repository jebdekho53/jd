import { Controller, Get, Header, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SitemapType } from '@prisma/client';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SitemapService } from './sitemap.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { LlmsTxtService } from './llms-txt.service';
import { ProgrammaticPageService } from './programmatic-page.service';
import { SchemaMarkupService } from './schema-markup.service';
import { AiCrawlerAnalyticsService } from './ai-crawler-analytics.service';
import { FaqEngineService } from './faq-engine.service';

@Public()
@Controller()
export class PublicSeoController {
  constructor(
    private readonly sitemap: SitemapService,
    private readonly llms: LlmsTxtService,
    private readonly crawlers: AiCrawlerAnalyticsService,
  ) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async sitemapIndex(@Req() req: Request) {
    void this.trackCrawler(req, '/sitemap.xml');
    return this.sitemap.getXml(SitemapType.INDEX);
  }

  @Get('sitemap-products.xml')
  @Header('Content-Type', 'application/xml')
  async sitemapProducts(@Req() req: Request) {
    void this.trackCrawler(req, '/sitemap-products.xml');
    return this.sitemap.getXml(SitemapType.PRODUCTS);
  }

  @Get('sitemap-stores.xml')
  @Header('Content-Type', 'application/xml')
  async sitemapStores(@Req() req: Request) {
    void this.trackCrawler(req, '/sitemap-stores.xml');
    return this.sitemap.getXml(SitemapType.STORES);
  }

  @Get('sitemap-categories.xml')
  @Header('Content-Type', 'application/xml')
  async sitemapCategories(@Req() req: Request) {
    void this.trackCrawler(req, '/sitemap-categories.xml');
    return this.sitemap.getXml(SitemapType.CATEGORIES);
  }

  @Get('sitemap-cities.xml')
  @Header('Content-Type', 'application/xml')
  async sitemapCities(@Req() req: Request) {
    void this.trackCrawler(req, '/sitemap-cities.xml');
    return this.sitemap.getXml(SitemapType.CITIES);
  }

  @Get('sitemap-faq.xml')
  @Header('Content-Type', 'application/xml')
  async sitemapFaq(@Req() req: Request) {
    void this.trackCrawler(req, '/sitemap-faq.xml');
    return this.sitemap.getXml(SitemapType.FAQ);
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  robots(@Req() req: Request) {
    void this.trackCrawler(req, '/robots.txt');
    return this.llms.robotsTxt();
  }

  @Get('llms.txt')
  @Header('Content-Type', 'text/plain')
  llmsTxt(@Req() req: Request) {
    void this.trackCrawler(req, '/llms.txt');
    return this.llms.generate();
  }

  private trackCrawler(req: Request, path: string) {
    void this.crawlers.recordVisit({
      userAgent: req.headers['user-agent'],
      path,
      ipAddress: req.ip,
    });
  }
}

@Public()
@ApiTags('public')
@Controller('public')
export class PublicKnowledgeController {
  constructor(
    private readonly knowledgeGraph: KnowledgeGraphService,
    private readonly faq: FaqEngineService,
    private readonly schema: SchemaMarkupService,
    private readonly pages: ProgrammaticPageService,
    private readonly crawlers: AiCrawlerAnalyticsService,
  ) {}

  @Get('knowledge')
  async knowledge(@Req() req: Request) {
    void this.crawlers.recordVisit({
      userAgent: req.headers['user-agent'],
      path: '/api/public/knowledge',
      ipAddress: req.ip,
    });
    const data = await this.knowledgeGraph.getPublicKnowledge();
    return {
      success: true,
      data: {
        ...data,
        schema: {
          organization: this.schema.organization(),
          webSite: this.schema.webSite(),
          faqPage: this.schema.faqPage(data.faqs.map((f) => ({ question: f.question, answer: f.answer }))),
        },
      },
    };
  }

  @Get('seo/page')
  async seoPage(@Query('path') path: string, @Req() req: Request) {
    if (!path) return { success: false, message: 'path required' };
    void this.crawlers.recordVisit({
      userAgent: req.headers['user-agent'],
      path,
      ipAddress: req.ip,
    });
    const page = await this.pages.getPageByPath(path);
    if (!page) return { success: false, message: 'Page not found' };
    const schemas = this.schema.forPage({
      pageType: page.pageType,
      title: page.title,
      faqs: page.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    });
    const featuredAnswer = page.faqs[0]
      ? await this.faq.generateFeaturedAnswer(page.faqs[0].question)
      : null;
    return { success: true, data: { page, schemas, featuredAnswer } };
  }
}
