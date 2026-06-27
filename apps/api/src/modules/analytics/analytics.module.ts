import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { WebSocketModule } from '../../common/websocket/websocket.module';
import { AnalyticsAggregatorService } from './analytics-aggregator.service';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';
import { AnalyticsMaterializerService } from './analytics-materializer.service';
import { AnalyticsMetricsCacheService } from './analytics-metrics-cache.service';
import { AnalyticsAlertService } from './analytics-alert.service';
import { AnalyticsExportService } from './analytics-export.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { MerchantAnalyticsController } from './merchant-analytics.controller';
import { AnalyticsGateway } from './analytics.gateway';
import { DeliveryTrackingModule } from '../delivery-tracking/delivery-tracking.module';
import { MerchantDashboardModule } from '../merchant-dashboard/merchant-dashboard.module';

@Module({
  imports: [DeliveryTrackingModule, MerchantDashboardModule, WebSocketModule],
  controllers: [AdminAnalyticsController, MerchantAnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsAggregatorService,
    AnalyticsSnapshotService,
    AnalyticsMaterializerService,
    AnalyticsMetricsCacheService,
    AnalyticsAlertService,
    AnalyticsExportService,
    AnalyticsGateway,
  ],
  exports: [AnalyticsService, AnalyticsMetricsCacheService],
})
export class AnalyticsModule {}
