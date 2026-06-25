import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderActorType, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OrderCacheService } from './order-cache.service';

export interface OrderStatusTransitionInput {
  orderId: string;
  toStatus: OrderStatus;
  actorType: OrderActorType;
  actorId?: string;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  extraOrderData?: Prisma.OrderUpdateInput;
  /** Skip write when order is already at toStatus (idempotent webhooks). */
  skipIfAlreadyStatus?: boolean;
}

@Injectable()
export class OrderStatusHistoryService {
  private readonly logger = new Logger(OrderStatusHistoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: OrderCacheService,
  ) {}

  async transition(input: OrderStatusTransitionInput): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      select: { id: true, status: true },
    });
    if (!order) throw new NotFoundException(`Order not found: ${input.orderId}`);

    if (input.skipIfAlreadyStatus && order.status === input.toStatus) {
      return false;
    }

    const fromStatus = order.status;
    const note = input.note ?? `Transitioned from ${fromStatus} to ${input.toStatus}`;

    const cancellationStatuses = new Set<OrderStatus>([
      OrderStatus.CANCELLED_BY_BUYER,
      OrderStatus.CANCELLED_BY_MERCHANT,
      OrderStatus.CANCELLED_BY_ADMIN,
    ]);
    const isCancellation = cancellationStatuses.has(input.toStatus);

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: input.orderId },
        data: {
          status: input.toStatus,
          ...(isCancellation && {
            cancelledAt: new Date(),
            cancelReason: input.note ?? undefined,
          }),
          ...(input.toStatus === OrderStatus.PAID && { paidAt: new Date() }),
          ...(input.toStatus === OrderStatus.DELIVERED && { completedAt: new Date() }),
          ...input.extraOrderData,
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: input.orderId,
          status: input.toStatus,
          note,
          changedBy: input.actorId,
          actorType: input.actorType,
          metadata: input.metadata,
        },
      }),
    ]);

    await this.cache.invalidateAll(input.orderId);
    this.logger.debug({ orderId: input.orderId, fromStatus, toStatus: input.toStatus }, 'Order status recorded');
    return true;
  }

  /** Timeline entry without changing order.status (delivery milestones). */
  async appendEntry(input: {
    orderId: string;
    status: OrderStatus;
    actorType: OrderActorType;
    actorId?: string;
    note?: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void> {
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: input.orderId,
        status: input.status,
        note: input.note,
        changedBy: input.actorId,
        actorType: input.actorType,
        metadata: input.metadata,
      },
    });
    await this.cache.invalidateAll(input.orderId);
  }

  /** Initial history row when order is first created (status already set on order row). */
  async recordInitial(
    orderId: string,
    status: OrderStatus,
    actorType: OrderActorType,
    note: string,
    actorId?: string,
    metadata?: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.appendEntry({ orderId, status, actorType, actorId, note, metadata });
  }
}
