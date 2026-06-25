import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { PrismaService } from '../../database/prisma.service';
import { AdAnalyticsService } from './ad-analytics.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/ads')
export class AdminAdsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AdAnalyticsService,
  ) {}

  @Get('overview')
  @Permissions('analytics:read')
  async overview() {
    const [metrics, topAdvertisers, campaigns] = await Promise.all([
      this.analytics.getAdminAnalytics(),
      this.prisma.adCampaign.groupBy({
        by: ['advertiserId'],
        _sum: { spentAmount: true },
        orderBy: { _sum: { spentAmount: 'desc' } },
        take: 10,
      }),
      this.prisma.adCampaign.findMany({
        where: { status: 'ACTIVE' },
        take: 20,
        include: { advertiser: { select: { businessName: true } } },
      }),
    ]);
    return { success: true, data: { metrics, topAdvertisers, campaigns } };
  }
}

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/analytics')
export class AdminAdsAnalyticsController {
  constructor(private readonly analytics: AdAnalyticsService) {}

  @Get('ads')
  @Permissions('analytics:read')
  async ads() {
    return { success: true, data: await this.analytics.getAdminAnalytics() };
  }
}
