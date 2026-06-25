import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { computeFleetPayout } from './fleet-payout.util';

/** Additive fleet payout estimates — does not alter existing rider payout records */
@Injectable()
export class FleetPayoutService {
  constructor(private readonly prisma: PrismaService) {}

  async estimateDeliveryPayout(deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: { include: { financialSnapshot: true, deliveryBatchItem: { include: { batch: true } } } },
      },
    });
    if (!delivery) return null;

    const baseEarning = Number(delivery.riderEarning ?? delivery.order.financialSnapshot?.riderPayoutAmount ?? 50);
    const batchSize = delivery.order.deliveryBatchItem?.batch.totalOrders ?? 1;
    const route = await this.prisma.routeOptimization.findFirst({
      where: { riderId: delivery.riderProfileId ?? undefined, batchId: delivery.order.deliveryBatchItem?.batchId },
      orderBy: { createdAt: 'desc' },
    });

    return computeFleetPayout({
      baseEarning,
      distanceKm: delivery.distanceKm ?? route?.distanceKm ?? 3,
      batchSize,
      optimized: route?.optimized ?? false,
    });
  }
}
