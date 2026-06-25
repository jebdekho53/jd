import { Module } from '@nestjs/common';
import { DeliveryTrackingModule } from '../delivery-tracking/delivery-tracking.module';
import { RiderClusteringService } from './rider-clustering.service';
import { BatchingService } from './batching.service';
import { RouteOptimizationService } from './route-optimization.service';
import { FleetBalancingService } from './fleet-balancing.service';
import { FleetAlertService } from './fleet-alert.service';
import { FleetAnalyticsService } from './fleet-analytics.service';
import { FleetPayoutService } from './fleet-payout.service';
import { FleetOsScheduler } from './fleet-os.scheduler';
import { FleetOsGateway } from './fleet-os.gateway';
import { AdminFleetOsController, AdminFleetAnalyticsController } from './admin-fleet-os.controller';
import { RiderFleetController } from './rider-fleet.controller';

@Module({
  imports: [DeliveryTrackingModule],
  controllers: [AdminFleetOsController, AdminFleetAnalyticsController, RiderFleetController],
  providers: [
    RiderClusteringService,
    BatchingService,
    RouteOptimizationService,
    FleetBalancingService,
    FleetAlertService,
    FleetAnalyticsService,
    FleetPayoutService,
    FleetOsScheduler,
    FleetOsGateway,
  ],
  exports: [BatchingService, RiderClusteringService, FleetAlertService, FleetAnalyticsService, FleetPayoutService],
})
export class FleetOsModule {}
