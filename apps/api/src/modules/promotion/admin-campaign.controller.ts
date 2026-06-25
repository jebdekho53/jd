import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { CampaignService } from './campaign.service';
import { CampaignAnalyticsService } from './campaign-analytics.service';
import { CreateCampaignDto, ListCampaignsDto, UpdateCampaignDto } from './dto/campaign.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/campaigns')
export class AdminCampaignController {
  constructor(
    private readonly campaigns: CampaignService,
    private readonly analytics: CampaignAnalyticsService,
  ) {}

  @Get()
  @Permissions('coupons:read')
  @ApiOperation({ summary: 'List platform and merchant campaigns' })
  async list(@Query() dto: ListCampaignsDto) {
    const result = await this.campaigns.listAdmin(dto);
    return {
      success: true,
      data: result.campaigns,
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @Get('analytics')
  @Permissions('coupons:read')
  async analyticsSummary() {
    const [summary, leaderboard, fraud] = await Promise.all([
      this.analytics.getPlatformSummary(),
      this.analytics.getLeaderboard(),
      this.analytics.getFraudSignals(),
    ]);
    return { success: true, data: { summary, leaderboard, fraud } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('coupons:write')
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateCampaignDto) {
    const data = await this.campaigns.createPlatformCampaign(user.id, dto);
    return { success: true, data };
  }

  @Patch(':id')
  @Permissions('coupons:write')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    const data = await this.campaigns.updateCampaign(user.id, id, dto);
    return { success: true, data };
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @Permissions('coupons:write')
  async pause(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.campaigns.pauseCampaign(user.id, id);
    return { success: true, data };
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @Permissions('coupons:write')
  async resume(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.campaigns.resumeCampaign(user.id, id);
    return { success: true, data };
  }
}
