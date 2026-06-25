import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { PrismaService } from '../../database/prisma.service';
import { SeoAnalyticsService } from './seo-analytics.service';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Controller('merchant/seo')
export class MerchantSeoController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: SeoAnalyticsService,
  ) {}

  private async primaryStoreId(userId: string) {
    const mp = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!mp) return null;
    const store = await this.prisma.store.findFirst({
      where: { merchantProfileId: mp.id, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return store?.id ?? null;
  }

  @Get('overview')
  @Permissions('analytics:read')
  async overview(@CurrentUser() user: RequestUser) {
    const storeId = await this.primaryStoreId(user.id);
    if (!storeId) return { success: true, data: {} };
    return { success: true, data: await this.analytics.getMerchantOverview(storeId) };
  }

  @Get('recommendations')
  @Permissions('analytics:read')
  async recommendations(@CurrentUser() user: RequestUser) {
    const storeId = await this.primaryStoreId(user.id);
    if (!storeId) return { success: true, data: { recommendations: [] } };
    const overview = await this.analytics.getMerchantOverview(storeId);
    return { success: true, data: { recommendations: overview?.recommendations ?? [] } };
  }
}
