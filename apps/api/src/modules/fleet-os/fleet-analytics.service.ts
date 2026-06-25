import { Injectable } from '@nestjs/common';
import { DeliveryBatchStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { computeFleetPayout } from './fleet-payout.util';

@Injectable()
export class FleetAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminFleetAnalytics() {
    const [onlineRiders, batches, routes, clusters] = await Promise.all([
      this.prisma.riderProfile.count({ where: { status: { in: ['ONLINE', 'ON_DELIVERY'] } } }),
      this.prisma.deliveryBatch.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        include: { items: true },
      }),
      this.prisma.routeOptimization.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        take: 200,
      }),
      this.prisma.riderCluster.findMany({ take: 20 }),
    ]);

    const totalDeliveries = await this.prisma.delivery.count({
      where: { status: 'DELIVERED', deliveredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });

    const avgBatchSize =
      batches.length > 0
        ? batches.reduce((s, b) => s + b.totalOrders, 0) / batches.length
        : 1;

    const routeEfficiency =
      routes.length > 0
        ? Math.round((routes.filter((r) => r.optimized).length / routes.length) * 100)
        : 0;

    const avgDistance =
      routes.length > 0 ? routes.reduce((s, r) => s + r.distanceKm, 0) / routes.length : 0;

    const samplePayout = computeFleetPayout({
      baseEarning: 50,
      distanceKm: avgDistance || 3,
      batchSize: Math.round(avgBatchSize),
      optimized: routeEfficiency > 50,
    });

    const utilization = totalDeliveries > 0 && onlineRiders > 0
      ? Math.min(100, Math.round((totalDeliveries / (onlineRiders * 7)) * 10))
      : 0;

    return {
      riderUtilization: utilization,
      avgBatchSize: Math.round(avgBatchSize * 10) / 10,
      routeEfficiency,
      deliveryCostSavings: samplePayout.efficiencyBonus + samplePayout.batchBonus,
      clusterDemandRatios: clusters.map((c) => ({
        city: c.city,
        locality: c.locality,
        ratio: c.demandSupplyRatio,
      })),
      activeBatches: batches.filter((b) => b.status !== DeliveryBatchStatus.COMPLETED).length,
    };
  }
}
