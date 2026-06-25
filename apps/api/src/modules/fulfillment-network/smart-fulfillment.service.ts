import { Injectable, Logger } from '@nestjs/common';
import {
  FulfillmentAuditAction,
  FulfillmentOrderStatus,
  OrderStatus,
  Prisma,
  StoreStatus,
  StoreType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { haversineKm } from '../../common/utils/delivery-eta.util';
import { CapacityService } from './capacity.service';
import { BUYER_STATUS_GROUPS } from '../order/order-status-groups';
import {
  CAPACITY_OVERLOAD_THRESHOLD,
  computeRoutingScore,
  estimateEtaMins,
  RoutingScoreInput,
} from './smart-fulfillment.util';

interface StoreCandidate {
  storeId: string;
  name: string;
  storeType: StoreType;
  latitude: number;
  longitude: number;
  avgPrepTimeMins: number;
  deliveryFee: number;
  ratingAvg: number;
}

interface ItemAllocation {
  orderItemId: string;
  variantId: string;
  sku: string;
  quantity: number;
  storeId: string;
  variantIdAtStore: string;
}

@Injectable()
export class SmartFulfillmentService {
  private readonly logger = new Logger(SmartFulfillmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly capacity: CapacityService,
  ) {}

  /** Allocate fulfillment nodes for an order. Non-blocking safe — idempotent. */
  async allocateOrder(orderId: string): Promise<void> {
    const existing = await this.prisma.fulfillmentOrder.count({ where: { orderId } });
    if (existing > 0) return;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        store: { select: { id: true, merchantProfileId: true, latitude: true, longitude: true } },
      },
    });
    if (!order) return;

    const candidates = await this.getEligibleStores(order.store.merchantProfileId, order.storeId);
    if (candidates.length === 0) {
      await this.createSingleFulfillment(orderId, order.storeId, order.items, null);
      return;
    }

    const allocations = await this.routeItems(
      order.items.map((i) => ({
        orderItemId: i.id,
        variantId: i.variantId,
        sku: i.sku,
        quantity: i.quantity,
      })),
      candidates,
      order.deliveryLat,
      order.deliveryLng,
    );

    const byStore = new Map<string, ItemAllocation[]>();
    for (const a of allocations) {
      const list = byStore.get(a.storeId) ?? [];
      list.push(a);
      byStore.set(a.storeId, list);
    }

    const isSplit = byStore.size > 1;
    const network = await this.prisma.storeNetwork.findFirst({
      where: { merchantProfileId: order.store.merchantProfileId, isActive: true },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const [storeId, items] of byStore) {
        const candidate = candidates.find((c) => c.storeId === storeId)!;
        const distKm = haversineKm(candidate.latitude, candidate.longitude, order.deliveryLat, order.deliveryLng);
        const etaMins = estimateEtaMins(distKm, candidate.avgPrepTimeMins);
        const score = await this.scoreStoreForItems(candidate, items, distKm, order.deliveryLat, order.deliveryLng);

        const fo = await tx.fulfillmentOrder.create({
          data: {
            orderId,
            fulfillmentStoreId: storeId,
            status: FulfillmentOrderStatus.ALLOCATED,
            etaMins,
            routingScore: score,
            items: {
              create: items.map((i) => ({
                orderItemId: i.orderItemId,
                variantId: i.variantId,
                quantity: i.quantity,
              })),
            },
          },
        });

        await tx.fulfillmentAudit.create({
          data: {
            networkId: network?.id,
            orderId,
            storeId,
            action: isSplit ? FulfillmentAuditAction.SPLIT_CREATED : FulfillmentAuditAction.ROUTE_SELECTED,
            metadata: { fulfillmentOrderId: fo.id, score, etaMins, isSplit } as Prisma.InputJsonValue,
          },
        });
      }

      if (isSplit) {
        await tx.order.update({ where: { id: orderId }, data: { isSplitFulfillment: true } });
      }
    });

    const primaryStoreId = [...byStore.keys()][0];
    await this.setPrimaryFulfillmentSource(orderId, primaryStoreId);

    this.logger.log({ orderId, fulfillmentNodes: byStore.size, isSplit }, 'Fulfillment allocated');
  }

  async getFulfillmentSourceForOrder(orderId: string): Promise<string | null> {
    const fo = await this.prisma.fulfillmentOrder.findFirst({
      where: { orderId },
      orderBy: { routingScore: 'asc' },
      select: { fulfillmentStoreId: true },
    });
    return fo?.fulfillmentStoreId ?? null;
  }

  private async setPrimaryFulfillmentSource(orderId: string, fulfillmentStoreId: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { orderId } });
    if (delivery) {
      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data: { fulfillmentStoreId },
      });
    }
  }

  private async createSingleFulfillment(
    orderId: string,
    storeId: string,
    items: Array<{ id: string; variantId: string; quantity: number }>,
    score: number | null,
  ) {
    await this.prisma.fulfillmentOrder.create({
      data: {
        orderId,
        fulfillmentStoreId: storeId,
        status: FulfillmentOrderStatus.ALLOCATED,
        routingScore: score ?? undefined,
        items: {
          create: items.map((i) => ({
            orderItemId: i.id,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        },
      },
    });
  }

  private async getEligibleStores(merchantProfileId: string, primaryStoreId: string): Promise<StoreCandidate[]> {
    const network = await this.prisma.storeNetwork.findFirst({
      where: { merchantProfileId, isActive: true },
      include: {
        hubs: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                storeType: true,
                latitude: true,
                longitude: true,
                avgPrepTimeMins: true,
                deliveryFee: true,
                ratingAvg: true,
                status: true,
                isActive: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    const baseWhere = {
      merchantProfileId,
      status: StoreStatus.APPROVED,
      isActive: true,
      deletedAt: null,
    };

    const stores = network
      ? network.hubs.map((h) => h.store).filter((s) => s.status === StoreStatus.APPROVED && s.isActive && !s.deletedAt)
      : await this.prisma.store.findMany({
          where: baseWhere,
          select: {
            id: true,
            name: true,
            storeType: true,
            latitude: true,
            longitude: true,
            avgPrepTimeMins: true,
            deliveryFee: true,
            ratingAvg: true,
          },
        });

    if (stores.length === 0) {
      const primary = await this.prisma.store.findUnique({
        where: { id: primaryStoreId },
        select: {
          id: true,
          name: true,
          storeType: true,
          latitude: true,
          longitude: true,
          avgPrepTimeMins: true,
          deliveryFee: true,
          ratingAvg: true,
        },
      });
      return primary ? [{ ...primary, storeId: primary.id, deliveryFee: Number(primary.deliveryFee) }] : [];
    }

    const eligible: StoreCandidate[] = [];
    for (const s of stores) {
      const cap = await this.capacity.getLatestCapacity(s.id);
      if (cap && cap.currentLoadPct >= CAPACITY_OVERLOAD_THRESHOLD) {
        await this.prisma.fulfillmentAudit.create({
          data: {
            storeId: s.id,
            action: FulfillmentAuditAction.CAPACITY_BLOCKED,
            metadata: { loadPct: cap.currentLoadPct } as Prisma.InputJsonValue,
          },
        });
        continue;
      }
      eligible.push({
        storeId: s.id,
        name: s.name,
        storeType: s.storeType,
        latitude: s.latitude,
        longitude: s.longitude,
        avgPrepTimeMins: s.avgPrepTimeMins,
        deliveryFee: Number(s.deliveryFee),
        ratingAvg: s.ratingAvg,
      });
    }

    return eligible.length > 0 ? eligible : stores.map((s) => ({
      storeId: s.id,
      name: s.name,
      storeType: s.storeType,
      latitude: s.latitude,
      longitude: s.longitude,
      avgPrepTimeMins: s.avgPrepTimeMins,
      deliveryFee: Number(s.deliveryFee),
      ratingAvg: s.ratingAvg,
    }));
  }

  private async routeItems(
    items: Array<{ orderItemId: string; variantId: string; sku: string; quantity: number }>,
    candidates: StoreCandidate[],
    deliveryLat: number,
    deliveryLng: number,
  ): Promise<ItemAllocation[]> {
    const scores = await Promise.all(
      candidates.map(async (c) => ({
        candidate: c,
        score: await this.scoreStoreForAllItems(c, items, deliveryLat, deliveryLng),
        canFulfillAll: await this.canFulfillAll(c.storeId, items),
      })),
    );

    const fullFulfillers = scores.filter((s) => s.canFulfillAll).sort((a, b) => a.score - b.score);
    if (fullFulfillers.length > 0) {
      const best = fullFulfillers[0].candidate;
      return items.map((i) => ({
        ...i,
        storeId: best.storeId,
        variantIdAtStore: i.variantId,
      }));
    }

    const allocations: ItemAllocation[] = [];
    for (const item of items) {
      let bestStore: StoreCandidate | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const c of candidates) {
        const avail = await this.getAvailableAtStore(c.storeId, item.sku, item.variantId);
        if (avail < item.quantity) continue;
        const distKm = haversineKm(c.latitude, c.longitude, deliveryLat, deliveryLng);
        const score = await this.scoreStoreForItems(c, [{ ...item, storeId: c.storeId, variantIdAtStore: item.variantId }], distKm, deliveryLat, deliveryLng);
        if (score < bestScore) {
          bestScore = score;
          bestStore = c;
        }
      }

      if (!bestStore) {
        bestStore = candidates[0];
      }

      allocations.push({
        orderItemId: item.orderItemId,
        variantId: item.variantId,
        sku: item.sku,
        quantity: item.quantity,
        storeId: bestStore.storeId,
        variantIdAtStore: item.variantId,
      });
    }

    return allocations;
  }

  private async canFulfillAll(storeId: string, items: Array<{ sku: string; variantId: string; quantity: number }>) {
    for (const item of items) {
      const avail = await this.getAvailableAtStore(storeId, item.sku, item.variantId);
      if (avail < item.quantity) return false;
    }
    return true;
  }

  private async getAvailableAtStore(storeId: string, sku: string, fallbackVariantId: string): Promise<number> {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        OR: [{ id: fallbackVariantId }, { sku, product: { storeId } }],
        product: { storeId, isActive: true },
        isActive: true,
      },
      include: { inventory: true },
    });
    return variant?.inventory?.availableQty ?? 0;
  }

  private async scoreStoreForAllItems(
    candidate: StoreCandidate,
    items: Array<{ sku: string; variantId: string; quantity: number }>,
    deliveryLat: number,
    deliveryLng: number,
  ): Promise<number> {
    const distKm = haversineKm(candidate.latitude, candidate.longitude, deliveryLat, deliveryLng);
    const itemAllocs = items.map((i) => ({
      orderItemId: '',
      variantId: i.variantId,
      sku: i.sku,
      quantity: i.quantity,
      storeId: candidate.storeId,
      variantIdAtStore: i.variantId,
    }));
    return this.scoreStoreForItems(candidate, itemAllocs, distKm, deliveryLat, deliveryLng);
  }

  private async scoreStoreForItems(
    candidate: StoreCandidate,
    items: ItemAllocation[],
    distKm: number,
    _deliveryLat: number,
    _deliveryLng: number,
  ): Promise<number> {
    let totalQty = 0;
    let availableQty = 0;
    for (const item of items) {
      const avail = await this.getAvailableAtStore(candidate.storeId, item.sku, item.variantId);
      totalQty += item.quantity;
      availableQty += Math.min(avail, item.quantity);
    }

    const cap = await this.capacity.getLatestCapacity(candidate.storeId);
    const delivered = await this.prisma.order.count({
      where: {
        storeId: candidate.storeId,
        status: OrderStatus.DELIVERED,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    const cancelled = await this.prisma.order.count({
      where: {
        storeId: candidate.storeId,
        status: { in: [...BUYER_STATUS_GROUPS.cancelled] },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    const successRate = delivered + cancelled > 0 ? delivered / (delivered + cancelled) : 0.9;

    const input: RoutingScoreInput = {
      inventoryAvailability: totalQty > 0 ? availableQty / totalQty : 0,
      etaMins: estimateEtaMins(distKm, candidate.avgPrepTimeMins),
      capacityLoadPct: cap?.currentLoadPct ?? 30,
      deliverySuccessRate: successRate,
      fulfillmentCost: candidate.deliveryFee + distKm * 5,
    };

    return computeRoutingScore(input);
  }
}
