import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { AnalyticsService } from './analytics.service';
import { MerchantAnalyticsQueryDto } from './dto/analytics-query.dto';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/analytics')
export class MerchantAnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly dashboard: MerchantDashboardService,
  ) {}

  @Get('snapshot')
  @ApiOperation({ summary: 'Store analytics from daily snapshots' })
  async getSnapshot(@CurrentUser() user: RequestUser, @Query() query: MerchantAnalyticsQueryDto) {
    await this.dashboard.resolveStoreContext(user.id, query.storeId);
    const data = await this.analytics.getMerchantSnapshot(query.storeId, query.period ?? '7d');
    return { success: true, data };
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Merchant analytics dashboard rollup' })
  async getStore(@CurrentUser() user: RequestUser, @Param('storeId') storeId: string, @Query() query: MerchantAnalyticsQueryDto) {
    await this.dashboard.resolveStoreContext(user.id, storeId);
    const data = await this.analytics.getMerchantSnapshot(storeId, query.period ?? '7d');
    return { success: true, data };
  }
}
