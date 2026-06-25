import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { CorporateAnalyticsService } from './corporate-analytics.service';
import { PrismaService } from '../../database/prisma.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/corporate')
export class AdminCorporateController {
  constructor(
    private readonly analytics: CorporateAnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('overview')
  @Permissions('analytics:read')
  async overview() {
    const [metrics, companies] = await Promise.all([
      this.analytics.getAdminAnalytics(),
      this.prisma.corporateAccount.findMany({
        include: { wallet: true, _count: { select: { users: true } } },
        take: 50,
      }),
    ]);
    return { success: true, data: { metrics, companies } };
  }
}

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/analytics')
export class AdminCorporateAnalyticsController {
  constructor(private readonly analytics: CorporateAnalyticsService) {}

  @Get('corporate')
  @Permissions('analytics:read')
  async corporate() {
    return { success: true, data: await this.analytics.getAdminAnalytics() };
  }
}
