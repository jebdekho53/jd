import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { PrismaService } from '../../database/prisma.service';
import { SeoAnalyticsService } from './seo-analytics.service';
import { FaqEngineService } from './faq-engine.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { AiCrawlerAnalyticsService } from './ai-crawler-analytics.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/seo')
export class AdminSeoController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: SeoAnalyticsService,
    private readonly faq: FaqEngineService,
    private readonly knowledge: KnowledgeGraphService,
    private readonly crawlers: AiCrawlerAnalyticsService,
  ) {}

  @Get('overview')
  @Permissions('analytics:read')
  async overview() {
    const [seo, aeo, geo, technical] = await Promise.all([
      this.analytics.getAdminOverview(),
      this.faq.getAeoMetrics(),
      this.knowledge.getGeoMetrics(),
      this.crawlers.getCrawlHealth(),
    ]);
    return { success: true, data: { seo, aeo, geo, technical } };
  }

  @Get('pages')
  @Permissions('analytics:read')
  async pages() {
    const data = await this.prisma.seoPage.findMany({
      where: { indexable: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return { success: true, data };
  }

  @Get('entities')
  @Permissions('analytics:read')
  async entities() {
    const data = await this.prisma.seoEntity.findMany({
      orderBy: { coverageScore: 'desc' },
      take: 100,
    });
    return { success: true, data };
  }

  @Get('citations')
  @Permissions('analytics:read')
  async citations() {
    const data = await this.prisma.geoMention.findMany({
      orderBy: { detectedAt: 'desc' },
      take: 50,
    });
    return { success: true, data };
  }

  @Get('keywords')
  @Permissions('analytics:read')
  async keywords() {
    const data = await this.prisma.seoKeyword.findMany({
      orderBy: { impressions: 'desc' },
      take: 50,
    });
    return { success: true, data };
  }
}
