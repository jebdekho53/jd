import { Injectable } from '@nestjs/common';
import { FulfillmentOrderStatus, OrderStatus, StoreType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { CapacityService } from './capacity.service';
import { RebalancingService } from './rebalancing.service';

@Injectable()
export class FulfillmentNetworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantDashboard: MerchantDashboardService,
    private readonly capacity: CapacityService,
    private readonly rebalancing: RebalancingService,
  ) {}

  async getOverview(userId: string, storeId?: string) {
    const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
    if (!ctx.merchantProfileId) {
      return { stores: [], darkStores: 0, warehouses: 0, splitOrderRatio: 0, networkName: null };
    }

    const network = await this.prisma.storeNetwork.findFirst({
      where: { merchantProfileId: ctx.merchantProfileId, isActive: true },
      include: {
        hubs: {
          include: {
            store: {
              select: { id: true, name: true, storeType: true, isActive: true, latitude: true, longitude: true },
            },
          },
        },
      },
    });

    const storeIds = storeId ? [storeId] : ctx.storeIds;
    const stores = network
      ? network.hubs.map((h) => h.store).filter((s) => storeIds.includes(s.id))
      : await this.prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true, storeType: true, isActive: true, latitude: true, longitude: true },
        });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalOrders, splitOrders] = await Promise.all([
      this.prisma.order.count({
        where: { storeId: { in: storeIds }, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.order.count({
        where: { storeId: { in: storeIds }, isSplitFulfillment: true, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return {
      networkName: network?.name ?? 'Default Network',
      stores,
      darkStores: stores.filter((s) => s.storeType === StoreType.DARK_STORE).length,
      warehouses: stores.filter((s) => s.storeType === StoreType.WAREHOUSE).length,
      microFulfillment: stores.filter((s) => s.storeType === StoreType.MICRO_FULFILLMENT_CENTER).length,
      splitOrderRatio: totalOrders > 0 ? Math.round((splitOrders / totalOrders) * 100) : 0,
    };
  }

  async getCapacity(userId: string, storeId?: string) {
    const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
    const storeIds = storeId ? [storeId] : ctx.storeIds;
    const rows = await this.capacity.listNetworkCapacity(storeIds);
    return rows.map((r) => ({
      storeId: r.storeId,
      ordersPerHour: r.snapshot?.ordersPerHour ?? 0,
      pickersAvailable: r.snapshot?.pickersAvailable ?? 0,
      packingStations: r.snapshot?.packingStations ?? 0,
      currentLoadPct: r.snapshot?.currentLoadPct ?? 0,
      peakLoadPct: r.snapshot?.peakLoadPct ?? 0,
      backlogCount: r.snapshot?.backlogCount ?? 0,
    }));
  }

  async getTransfers(userId: string, storeId?: string) {
    return this.prisma.inventoryTransfer.findMany({
      where: {
        ...(storeId
          ? { OR: [{ fromStoreId: storeId }, { toStoreId: storeId }] }
          : {}),
      },
      include: {
        items: true,
        fromStore: { select: { name: true, storeType: true } },
        toStore: { select: { name: true, storeType: true } },
      },
      orderBy: { requestedAt: 'desc' },
      take: 20,
    });
  }

  async getRebalancing(userId: string, storeId?: string) {
    const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
    if (!ctx.merchantProfileId) return [];
    return this.rebalancing.getSuggestions(ctx.merchantProfileId);
  }

  async getPerformance(userId: string, storeId?: string) {
    const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
    const storeIds = storeId ? [storeId] : ctx.storeIds;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [fulfillmentOrders, delivered, transfers] = await Promise.all([
      this.prisma.fulfillmentOrder.count({
        where: { fulfillmentStoreId: { in: storeIds }, createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.fulfillmentOrder.count({
        where: {
          fulfillmentStoreId: { in: storeIds },
          status: FulfillmentOrderStatus.COMPLETED,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.inventoryTransfer.count({
        where: {
          merchantProfileId: ctx.merchantProfileId ?? undefined,
          status: 'RECEIVED',
          completedAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    const darkStoreOrders = await this.prisma.fulfillmentOrder.count({
      where: {
        fulfillmentStore: { storeType: StoreType.DARK_STORE, id: { in: storeIds } },
        createdAt: { gte: sevenDaysAgo },
      },
    });

    return {
      fulfillmentAccuracy: fulfillmentOrders > 0 ? Math.round((delivered / fulfillmentOrders) * 100) : 100,
      transferSuccessRate: transfers,
      darkStorePerformance: darkStoreOrders,
      avgPickTimeMins: 8,
      avgPackTimeMins: 5,
      capacityUtilization: 0,
    };
  }
}
