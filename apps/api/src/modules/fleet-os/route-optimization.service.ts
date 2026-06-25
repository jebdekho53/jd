import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { optimizeRoute, type RouteStop } from './route-optimization.util';
import { FLEET_EVENTS } from './fleet-os.events';

@Injectable()
export class RouteOptimizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async optimizeForBatch(batchId: string) {
    const batch = await this.prisma.deliveryBatch.findUnique({
      where: { id: batchId },
      include: {
        items: {
          include: {
            order: {
              include: { store: true },
            },
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    if (!batch || batch.items.length === 0) return null;

    const stops: RouteStop[] = [];
    for (const item of batch.items) {
      const store = item.order.store;
      stops.push({
        orderId: item.orderId,
        lat: store.latitude,
        lng: store.longitude,
        type: 'pickup',
      });
      stops.push({
        orderId: item.orderId,
        lat: item.order.deliveryLat,
        lng: item.order.deliveryLng,
        type: 'drop',
      });
    }

    const rider = await this.prisma.riderProfile.findUnique({ where: { id: batch.riderId } });
    const start = {
      lat: rider?.currentLat ?? batch.items[0].order.store.latitude,
      lng: rider?.currentLng ?? batch.items[0].order.store.longitude,
    };

    const result = optimizeRoute(stops, start);

    const record = await this.prisma.routeOptimization.create({
      data: {
        riderId: batch.riderId,
        batchId: batch.id,
        distanceKm: result.distanceKm,
        estimatedMinutes: result.estimatedMinutes,
        optimized: result.optimized,
        routeSequence: result.sequence as unknown as Prisma.InputJsonValue,
      },
    });

    this.events.emit(`ws.${FLEET_EVENTS.ROUTE_OPTIMIZED}`, { route: record, batchId });
    return record;
  }

  async getLatestForRider(riderId: string) {
    return this.prisma.routeOptimization.findFirst({
      where: { riderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
