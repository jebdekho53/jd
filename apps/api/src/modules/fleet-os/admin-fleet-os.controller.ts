import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { RiderClusteringService } from './rider-clustering.service';
import { BatchingService } from './batching.service';
import { FleetAlertService } from './fleet-alert.service';
import { FleetBalancingService } from './fleet-balancing.service';
import { FleetAnalyticsService } from './fleet-analytics.service';
import { RouteOptimizationService } from './route-optimization.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/fleet-os')
export class AdminFleetOsController {
  constructor(
    private readonly tracking: DeliveryTrackingService,
    private readonly clusters: RiderClusteringService,
    private readonly batching: BatchingService,
    private readonly alerts: FleetAlertService,
    private readonly balancing: FleetBalancingService,
    private readonly analytics: FleetAnalyticsService,
    private readonly routes: RouteOptimizationService,
  ) {}

  @Get('overview')
  @Permissions('analytics:read')
  async overview() {
    const [fleet, clusterList, batches, alertList, balance, metrics] = await Promise.all([
      this.tracking.getFleetLive(),
      this.clusters.listClusters(),
      this.batching.listActiveBatches(),
      this.alerts.listOpenAlerts(),
      this.balancing.getBalanceSuggestions(),
      this.analytics.getAdminFleetAnalytics(),
    ]);
    return {
      success: true,
      data: { fleet, clusters: clusterList, batches, alerts: alertList, balance, metrics },
    };
  }
}

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/analytics')
export class AdminFleetAnalyticsController {
  constructor(private readonly analytics: FleetAnalyticsService) {}

  @Get('fleet')
  @Permissions('analytics:read')
  async fleet() {
    return { success: true, data: await this.analytics.getAdminFleetAnalytics() };
  }
}
