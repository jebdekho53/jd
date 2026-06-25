import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FranchisePartnerStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { FranchiseService } from './franchise.service';
import { TerritoryService } from './territory.service';
import { ExpansionService } from './expansion.service';
import { FranchiseAnalyticsService } from './franchise-analytics.service';
import { FranchiseSettlementService } from './franchise-settlement.service';
import { CreateCityLaunchDto, CreateFranchiseDto, UpdateFranchiseDto } from './dto/franchise.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/expansion')
export class AdminExpansionController {
  constructor(
    private readonly franchise: FranchiseService,
    private readonly territory: TerritoryService,
    private readonly expansion: ExpansionService,
    private readonly analytics: FranchiseAnalyticsService,
    private readonly settlements: FranchiseSettlementService,
  ) {}

  @Get('overview')
  @Permissions('settlements:read')
  async overview() {
    const [franchiseOverview, cities, conflicts, revenue, franchises] = await Promise.all([
      this.franchise.getOverview(),
      this.expansion.listCities(),
      this.territory.listConflicts(),
      this.settlements.listAllSettlements(),
      this.franchise.listFranchises(),
    ]);
    return { success: true, data: { ...franchiseOverview, cities, conflicts, revenue, franchises } };
  }

  @Get('cities')
  @Permissions('settlements:read')
  async cities() {
    return { success: true, data: await this.expansion.listCities() };
  }

  @Get('franchises')
  @Permissions('settlements:read')
  async franchises(@Query('status') status?: FranchisePartnerStatus) {
    return { success: true, data: await this.franchise.listFranchises(status) };
  }

  @Get('conflicts')
  @Permissions('settlements:read')
  async conflicts() {
    return { success: true, data: await this.territory.listConflicts() };
  }

  @Post('franchise')
  @Permissions('settlements:manage')
  async createFranchise(@Body() dto: CreateFranchiseDto) {
    return { success: true, data: await this.franchise.createFranchise(dto) };
  }

  @Patch('franchise/:id')
  @Permissions('settlements:manage')
  async updateFranchise(
    @Param('id') id: string,
    @Body() dto: UpdateFranchiseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return { success: true, data: await this.franchise.updateFranchise(id, dto, user.id) };
  }

  @Post('city-launch')
  @Permissions('settlements:manage')
  async cityLaunch(@Body() dto: CreateCityLaunchDto) {
    const plan = await this.expansion.createCityLaunch(dto);
    await this.expansion.triggerLaunchCampaign(dto.city, dto.state);
    return { success: true, data: plan };
  }
}

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/analytics')
export class AdminFranchiseAnalyticsController {
  constructor(private readonly analytics: FranchiseAnalyticsService) {}

  @Get('franchise')
  @Permissions('analytics:read')
  async franchiseAnalytics() {
    return { success: true, data: await this.analytics.getAdminFranchiseAnalytics() };
  }
}
