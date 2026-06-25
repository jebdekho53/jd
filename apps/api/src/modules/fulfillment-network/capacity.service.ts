import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus } from '@prisma/client';
import { BUYER_STATUS_GROUPS } from '../order/order-status-groups';

@Injectable()
export class CapacityService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestCapacity(storeId: string) {
    return this.prisma.storeCapacitySnapshot.findFirst({
      where: { storeId },
      orderBy: { snapshotAt: 'desc' },
    });
  }

  async snapshotStoreCapacity(storeId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [ordersLastHour, backlog] = await Promise.all([
      this.prisma.order.count({
        where: {
          storeId,
          createdAt: { gte: oneHourAgo },
          status: { notIn: [...BUYER_STATUS_GROUPS.cancelled] },
        },
      }),
      this.prisma.order.count({
        where: {
          storeId,
          status: {
            in: [OrderStatus.CREATED, OrderStatus.PAID, OrderStatus.MERCHANT_ACCEPTED, OrderStatus.PREPARING],
          },
        },
      }),
    ]);

    const ordersPerHour = ordersLastHour;
    const pickersAvailable = Math.max(1, 3 - Math.floor(backlog / 5));
    const packingStations = 2;
    const currentLoadPct = Math.min(100, backlog * 8 + ordersPerHour * 2);
    const peakLoadPct = Math.min(100, currentLoadPct * 1.2);

    return this.prisma.storeCapacitySnapshot.create({
      data: {
        storeId,
        ordersPerHour,
        pickersAvailable,
        packingStations,
        currentLoadPct,
        peakLoadPct,
        backlogCount: backlog,
      },
    });
  }

  async listNetworkCapacity(storeIds: string[]) {
    const snapshots = await Promise.all(storeIds.map((id) => this.getLatestCapacity(id)));
    return storeIds.map((storeId, i) => ({
      storeId,
      snapshot: snapshots[i],
    }));
  }
}
