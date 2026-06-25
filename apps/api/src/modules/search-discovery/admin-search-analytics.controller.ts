import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { SearchAnalyticsService } from './search-analytics.service';
import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class AdminSearchAnalyticsQueryDto {
  @ApiPropertyOptional({ enum: ['24h', '7d', '30d'] })
  @IsOptional()
  @IsIn(['24h', '7d', '30d'])
  period?: '24h' | '7d' | '30d';
}

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/search-analytics')
export class AdminSearchAnalyticsController {
  constructor(private readonly analytics: SearchAnalyticsService) {}

  @Get()
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Search analytics for admin BI' })
  async getAnalytics(@Query() query: AdminSearchAnalyticsQueryDto) {
    const data = await this.analytics.getAdminAnalytics(query.period ?? '7d');
    return { success: true, data };
  }
}
