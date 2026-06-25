import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RiderClusteringService } from './rider-clustering.service';
import { FleetAlertService } from './fleet-alert.service';
import { BatchingService } from './batching.service';

@Injectable()
export class FleetOsScheduler {
  private readonly logger = new Logger(FleetOsScheduler.name);

  constructor(
    private readonly clusters: RiderClusteringService,
    private readonly alerts: FleetAlertService,
    private readonly batching: BatchingService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshFleetState() {
    try {
      await this.clusters.refreshClusters();
      await this.alerts.scanAndCreateAlerts();
      await this.batching.autoBatchUnassigned();
    } catch (err) {
      this.logger.error('Fleet OS refresh failed', err instanceof Error ? err.stack : String(err));
    }
  }
}
