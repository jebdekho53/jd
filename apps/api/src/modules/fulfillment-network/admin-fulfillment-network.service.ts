import { Injectable } from '@nestjs/common';
import { FulfillmentOrderStatus, InventoryTransferStatus, OrderStatus, StoreType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminFulfillmentNetworkService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [networks, darkStores, transfers, splitOrders, totalOrders] = await Promise.all([
      this.prisma.storeNetwork.count({ where: { isActive: true } }),
      this.prisma.store.count({ where: { storeType: StoreType.DARK_STORE, isActive: true } }),
      this.prisma.inventoryTransfer.count({
        where: { status: { in: [InventoryTransferStatus.REQUESTED, InventoryTransferStatus.IN_TRANSIT] } },
      }),
      this.prisma.order.count({ where: { isSplitFulfillment: true } }),
      this.prisma.order.count(),
    ]);

    const recentAudits = await this.prisma.fulfillmentAudit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { store: { select: { name: true } }, order: { select: { orderNumber: true } } },
    });

    return {
      activeNetworks: networks,
      darkStores,
      pendingTransfers: transfers,
      splitOrderRatio: totalOrders > 0 ? Math.round((splitOrders / totalOrders) * 100) : 0,
      recentActivity: recentAudits,
    };
  }

  async listTransfers() {
    return this.prisma.inventoryTransfer.findMany({
      include: {
        items: true,
        fromStore: { select: { name: true, storeType: true } },
        toStore: { select: { name: true, storeType: true } },
      },
      orderBy: { requestedAt: 'desc' },
      take: 50,
    });
  }

  async getCapacityHeatmap() {
    const snapshots = await this.prisma.storeCapacitySnapshot.findMany({
      orderBy: { snapshotAt: 'desc' },
      distinct: ['storeId'],
      take: 100,
      include: { store: { select: { id: true, name: true, storeType: true, latitude: true, longitude: true } } },
    });
    return snapshots.map((s) => ({
      storeId: s.storeId,
      storeName: s.store.name,
      storeType: s.store.storeType,
      lat: s.store.latitude,
      lng: s.store.longitude,
      currentLoadPct: s.currentLoadPct,
      peakLoadPct: s.peakLoadPct,
      backlogCount: s.backlogCount,
    }));
  }

  async getSlaMetrics() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fulfillmentOrders = await this.prisma.fulfillmentOrder.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, etaMins: { not: null } },
      select: { etaMins: true, status: true },
    });

    const onTime = fulfillmentOrders.filter(
      (f) => f.status === FulfillmentOrderStatus.COMPLETED || f.status === FulfillmentOrderStatus.DISPATCHED,
    ).length;
    const total = fulfillmentOrders.length;
    const avgEta = total > 0 ? Math.round(fulfillmentOrders.reduce((s, f) => s + (f.etaMins ?? 0), 0) / total) : 0;

    const delivered = await this.prisma.order.count({
      where: { status: OrderStatus.DELIVERED, createdAt: { gte: sevenDaysAgo } },
    });

    return {
      fulfillmentSlaPct: total > 0 ? Math.round((onTime / total) * 100) : 100,
      avgEtaMins: avgEta,
      ordersDelivered7d: delivered,
      pickTimeMins: 8,
      packTimeMins: 5,
    };
  }
}
