import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DeliveryProviderType, ShipmentProviderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';

// Shipments still in flight — worth polling Shadowfax for rider/status updates.
// Terminal states (DELIVERED / FAILED / RETURNED / CANCELLED) are skipped.
const ACTIVE_STATUSES: ShipmentProviderStatus[] = [
  ShipmentProviderStatus.PENDING,
  ShipmentProviderStatus.ASSIGNED,
  ShipmentProviderStatus.PICKUP_STARTED,
  ShipmentProviderStatus.PICKED_UP,
  ShipmentProviderStatus.IN_TRANSIT,
  ShipmentProviderStatus.NEARBY,
];

/**
 * Polls Shadowfax for tracking updates on active shipments. Rider name/phone/
 * location primarily arrive via webhooks, but this poll is the fallback that
 * keeps tracking fresh even if a webhook is missed or not yet configured.
 */
@Injectable()
export class ShipmentTrackingScheduler {
  private readonly logger = new Logger(ShipmentTrackingScheduler.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: DeliveryOrchestratorService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async pollActiveShipments(): Promise<void> {
    // Skip if a previous run is still in progress (avoids overlapping API bursts).
    if (this.running) return;
    this.running = true;
    try {
      const shipments = await this.prisma.providerShipment.findMany({
        where: {
          providerType: DeliveryProviderType.SHADOWFAX,
          externalShipmentId: { not: null },
          normalizedStatus: { in: ACTIVE_STATUSES },
        },
        select: { orderId: true },
        orderBy: { updatedAt: 'asc' },
        take: 100,
      });
      if (shipments.length === 0) return;

      let synced = 0;
      for (const shipment of shipments) {
        try {
          await this.orchestrator.syncShipmentTracking(shipment.orderId);
          synced += 1;
        } catch (err) {
          this.logger.warn(
            `Tracking sync failed for order ${shipment.orderId}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
      this.logger.log(`Polled ${synced}/${shipments.length} active Shadowfax shipment(s)`);
    } finally {
      this.running = false;
    }
  }
}
