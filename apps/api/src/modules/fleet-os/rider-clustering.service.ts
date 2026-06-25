import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeliveryStatus, RiderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FLEET_EVENTS } from './fleet-os.events';

@Injectable()
export class RiderClusteringService {
  private readonly logger = new Logger(RiderClusteringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async refreshClusters() {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true, status: 'APPROVED' },
      include: { city: true },
      take: 200,
    });

    const clusterMap = new Map<string, { city: string; locality: string; riders: number; orders: number }>();

    for (const store of stores) {
      const key = `${store.city.name}|${store.locality ?? 'Central'}`;
      const entry = clusterMap.get(key) ?? {
        city: store.city.name,
        locality: store.locality ?? 'Central',
        riders: 0,
        orders: 0,
      };
      clusterMap.set(key, entry);
    }

    const onlineRiders = await this.prisma.riderProfile.findMany({
      where: { status: { in: [RiderStatus.ONLINE, RiderStatus.ON_DELIVERY] } },
      select: { id: true, currentLat: true, currentLng: true },
    });

    for (const rider of onlineRiders) {
      if (rider.currentLat == null || rider.currentLng == null) continue;
      const nearest = stores[0];
      if (!nearest) continue;
      const key = `${nearest.city.name}|${nearest.locality ?? 'Central'}`;
      const entry = clusterMap.get(key);
      if (entry) entry.riders++;
    }

    const activeOrders = await this.prisma.order.findMany({
      where: {
        delivery: { status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.ACCEPTED, DeliveryStatus.PICKED_UP] } },
      },
      include: { store: { include: { city: true } } },
      take: 500,
    });

    for (const order of activeOrders) {
      const key = `${order.store.city.name}|${order.store.locality ?? 'Central'}`;
      const entry = clusterMap.get(key);
      if (entry) entry.orders++;
    }

    const results = [];
    for (const entry of clusterMap.values()) {
      const ratio = entry.riders > 0 ? entry.orders / entry.riders : entry.orders;
      const cluster = await this.prisma.riderCluster.upsert({
        where: { city_locality: { city: entry.city, locality: entry.locality } },
        update: {
          activeRiders: entry.riders,
          activeOrders: entry.orders,
          demandSupplyRatio: Math.round(ratio * 100) / 100,
        },
        create: {
          city: entry.city,
          locality: entry.locality,
          activeRiders: entry.riders,
          activeOrders: entry.orders,
          demandSupplyRatio: Math.round(ratio * 100) / 100,
        },
      });
      results.push(cluster);
    }

    this.events.emit(`ws.${FLEET_EVENTS.CLUSTER_UPDATED}`, { clusters: results });
    this.logger.log(`Refreshed ${results.length} rider clusters`);
    return results;
  }

  async listClusters() {
    return this.prisma.riderCluster.findMany({
      orderBy: { demandSupplyRatio: 'desc' },
      take: 100,
    });
  }
}
