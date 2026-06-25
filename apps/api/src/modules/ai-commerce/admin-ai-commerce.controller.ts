import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { AICommerceOrchestratorService } from './ai-commerce-orchestrator.service';
import { HotspotService } from './hotspot.service';
import { DemandForecastService } from './demand-forecast.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/ai-commerce')
export class AdminAICommerceController {
  constructor(
    private readonly orchestrator: AICommerceOrchestratorService,
    private readonly hotspots: HotspotService,
    private readonly demand: DemandForecastService,
  ) {}

  @Get('overview')
  @Permissions('analytics:read')
  async overview() {
    return { success: true, data: await this.orchestrator.getAdminOverview() };
  }

  @Get('hotspots')
  @Permissions('analytics:read')
  async hotspotList() {
    return { success: true, data: await this.hotspots.getHotspots() };
  }

  @Get('forecasts')
  @Permissions('analytics:read')
  async forecasts() {
    return { success: true, data: await this.demand.getAdminForecasts() };
  }
}
