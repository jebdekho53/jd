import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { SearchAnalyticsService } from './search-analytics.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class MerchantSearchInsightsQueryDto {
  @ApiPropertyOptional({ enum: ['7d', '30d'] })
  @IsOptional()
  @IsIn(['7d', '30d'])
  period?: '7d' | '30d';
}

@ApiTags(Tags.MERCHANTS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MERCHANT')
@Controller('merchant/search-insights')
export class MerchantSearchInsightsController {
  constructor(
    private readonly analytics: SearchAnalyticsService,
    private readonly dashboard: MerchantDashboardService,
  ) {}

  @Get(':storeId')
  @ApiOperation({ summary: 'Search impressions, CTR, and conversion for a store' })
  async getInsights(
    @CurrentUser() user: RequestUser,
    @Param('storeId') storeId: string,
    @Query() query: MerchantSearchInsightsQueryDto,
  ) {
    await this.dashboard.resolveStoreContext(user.id, storeId);
    const data = await this.analytics.getMerchantInsights(storeId, query.period ?? '7d');
    return { success: true, data };
  }
}
