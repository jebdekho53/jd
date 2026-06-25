import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeliveryBatchStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { groupOrdersIntoBatches, type BatchableOrder } from './batching.util';
import { FLEET_EVENTS } from './fleet-os.events';
import { unassignedOrderWhere } from '../rider-assignment/rider-assignment.util';

@Injectable()
export class BatchingService {
  private readonly logger = new Logger(BatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async createBatchesForRider(riderId: string) {
    const existing = await this.prisma.deliveryBatch.findFirst({
      where: { riderId, status: { in: [DeliveryBatchStatus.PLANNED, DeliveryBatchStatus.ACTIVE] } },
    });
    if (existing) return existing;

    const deliveries = await this.prisma.delivery.findMany({
      where: { riderProfileId: riderId, status: { in: ['ASSIGNED', 'ACCEPTED'] } },
      include: { order: { include: { store: true } } },
      take: 10,
    });

    if (deliveries.length === 0) return null;

    const batchable: BatchableOrder[] = deliveries.map((d) => ({
      orderId: d.orderId,
      locality: d.order.store.locality ?? 'Central',
      pickupZoneId: d.order.storeId,
      deliveryLat: d.deliveryLat,
      deliveryLng: d.deliveryLng,
    }));

    const groups = groupOrdersIntoBatches(batchable);
    const first = groups[0];
    if (!first?.length) return null;

    const batch = await this.prisma.deliveryBatch.create({
      data: {
        riderId,
        status: DeliveryBatchStatus.PLANNED,
        totalOrders: first.length,
        items: {
          create: first.map((o, i) => ({
            orderId: o.orderId,
            sequence: i + 1,
          })),
        },
      },
      include: { items: true },
    });

    this.events.emit(`ws.${FLEET_EVENTS.BATCH_CREATED}`, { batch });
    this.logger.log(`Created batch ${batch.id} with ${first.length} orders for rider ${riderId}`);
    return batch;
  }

  async autoBatchUnassigned() {
    const orders = await this.prisma.order.findMany({
      where: unassignedOrderWhere(),
      include: { store: true },
      take: 30,
    });

    if (orders.length < 2) return [];

    const batchable: BatchableOrder[] = orders.map((o) => ({
      orderId: o.id,
      locality: o.store.locality ?? 'Central',
      pickupZoneId: o.storeId,
      deliveryLat: o.deliveryLat,
      deliveryLng: o.deliveryLng,
    }));

    const groups = groupOrdersIntoBatches(batchable);
    return groups.filter((g) => g.length > 1);
  }

  async getRiderBatch(riderId: string) {
    return this.prisma.deliveryBatch.findFirst({
      where: { riderId, status: { in: [DeliveryBatchStatus.PLANNED, DeliveryBatchStatus.ACTIVE] } },
      include: {
        items: {
          include: { order: { select: { id: true, orderNumber: true, status: true } } },
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  async getOrderBatchInfo(orderId: string) {
    const item = await this.prisma.deliveryBatchItem.findUnique({
      where: { orderId },
      include: {
        batch: {
          include: {
            items: { include: { order: { select: { orderNumber: true } } }, orderBy: { sequence: 'asc' } },
          },
        },
      },
    });
    if (!item) return { isBatched: false };
    return {
      isBatched: item.batch.totalOrders > 1,
      batchId: item.batchId,
      batchStatus: item.batch.status,
      sequence: item.sequence,
      totalOrders: item.batch.totalOrders,
      orders: item.batch.items.map((i) => i.order.orderNumber),
    };
  }

  async listActiveBatches() {
    return this.prisma.deliveryBatch.findMany({
      where: { status: { in: [DeliveryBatchStatus.PLANNED, DeliveryBatchStatus.ACTIVE] } },
      include: {
        rider: { select: { id: true, name: true } },
        items: { include: { order: { select: { orderNumber: true } } } },
      },
      take: 50,
    });
  }
}
