import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeliveryStatus, FleetAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FLEET_EVENTS } from './fleet-os.events';

@Injectable()
export class FleetAlertService {
  private readonly logger = new Logger(FleetAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async scanAndCreateAlerts() {
    const created = [];

    const clusters = await this.prisma.riderCluster.findMany({ take: 50 });
    for (const c of clusters) {
      if (c.activeOrders > 5 && c.activeRiders < 2) {
        const alert = await this.createAlert(
          FleetAlertType.LOW_RIDER_SUPPLY,
          `Low rider supply in ${c.locality}, ${c.city}`,
          { city: c.city, locality: c.locality },
        );
        created.push(alert);
      }
      if (c.demandSupplyRatio > 3) {
        const alert = await this.createAlert(
          FleetAlertType.ORDER_SURGE,
          `Order surge in ${c.locality} — ratio ${c.demandSupplyRatio}`,
          { city: c.city, locality: c.locality },
        );
        created.push(alert);
      }
      if (c.activeRiders > 3 && c.activeOrders === 0) {
        const alert = await this.createAlert(
          FleetAlertType.CLUSTER_IMBALANCE,
          `Rider oversupply in ${c.locality}`,
          { city: c.city, locality: c.locality },
        );
        created.push(alert);
      }
    }

    const slow = await this.prisma.delivery.count({
      where: {
        status: DeliveryStatus.PICKED_UP,
        pickedUpAt: { lt: new Date(Date.now() - 45 * 60 * 1000) },
      },
    });
    if (slow > 0) {
      const alert = await this.createAlert(
        FleetAlertType.SLOW_DELIVERIES,
        `${slow} deliveries delayed beyond 45 minutes`,
        {},
      );
      created.push(alert);
    }

    this.logger.log(`Created ${created.length} fleet alerts`);
    return created;
  }

  async listOpenAlerts() {
    return this.prisma.fleetAlert.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async createAlert(
    alertType: FleetAlertType,
    message: string,
    meta: { city?: string; locality?: string; riderProfileId?: string },
  ) {
    const existing = await this.prisma.fleetAlert.findFirst({
      where: {
        alertType,
        status: 'OPEN',
        city: meta.city ?? null,
        locality: meta.locality ?? null,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (existing) return existing;

    const alert = await this.prisma.fleetAlert.create({
      data: {
        alertType,
        message,
        city: meta.city,
        locality: meta.locality,
        riderProfileId: meta.riderProfileId,
        metadata: meta,
      },
    });
    this.events.emit(`ws.${FLEET_EVENTS.ALERT_CREATED}`, { alert });
    return alert;
  }
}
