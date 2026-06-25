import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { MembershipAnalyticsService } from './membership-analytics.service';
import { PrismaService } from '../../database/prisma.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/membership')
export class AdminMembershipController {
  constructor(
    private readonly analytics: MembershipAnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('overview')
  @Permissions('analytics:read')
  async overview() {
    const [metrics, subscribers] = await Promise.all([
      this.analytics.getAdminAnalytics(),
      this.prisma.membershipSubscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true, user: { select: { phone: true } } },
        take: 50,
      }),
    ]);
    return { success: true, data: { metrics, subscribers } };
  }
}

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/analytics')
export class AdminMembershipAnalyticsController {
  constructor(private readonly analytics: MembershipAnalyticsService) {}

  @Get('membership')
  @Permissions('analytics:read')
  async membership() {
    return { success: true, data: await this.analytics.getAdminAnalytics() };
  }
}
