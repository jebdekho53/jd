import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  DeliveryStatus,
  DomainEventType,
  KycStatus,
  OrderStatus,
  Prisma,
  RiderStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';

// ── State machine ────────────────────────────────────────────────────────────
//
// Each delivery status maps to the single valid next step.

const DELIVERY_NEXT: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  [DeliveryStatus.ASSIGNED]: DeliveryStatus.ACCEPTED,
  [DeliveryStatus.ACCEPTED]: DeliveryStatus.ARRIVED_AT_STORE,
  [DeliveryStatus.ARRIVED_AT_STORE]: DeliveryStatus.PICKED_UP,
  [DeliveryStatus.PICKED_UP]: DeliveryStatus.ARRIVED_AT_CUSTOMER,
  [DeliveryStatus.ARRIVED_AT_CUSTOMER]: DeliveryStatus.DELIVERED,
};

const TERMINAL_DELIVERY = new Set<DeliveryStatus>([
  DeliveryStatus.DELIVERED,
  DeliveryStatus.FAILED,
  DeliveryStatus.CANCELLED,
  DeliveryStatus.REJECTED,
]);

// Map delivery status → corresponding Order status update (only some steps sync to Order)
const DELIVERY_TO_ORDER_STATUS: Partial<Record<DeliveryStatus, OrderStatus>> = {
  [DeliveryStatus.ACCEPTED]: OrderStatus.RIDER_ASSIGNED,
  [DeliveryStatus.PICKED_UP]: OrderStatus.OUT_FOR_DELIVERY,
  [DeliveryStatus.DELIVERED]: OrderStatus.DELIVERED,
};

// Map delivery status → audit action
const AUDIT_ACTIONS: Partial<Record<DeliveryStatus, string>> = {
  [DeliveryStatus.ACCEPTED]: 'RIDER_ACCEPTED',
  [DeliveryStatus.PICKED_UP]: 'RIDER_PICKED_UP',
  [DeliveryStatus.DELIVERED]: 'RIDER_DELIVERED',
};

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
  ) {}

  // ── Get delivery for a rider ───────────────────────────────────────────────

  async getRiderDeliveries(userId: string) {
    const riderProfile = await this.requireRiderProfile(userId);

    return this.prisma.delivery.findMany({
      where: { riderProfileId: riderProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentMethod: true,
            totalAmount: true,
            deliveryAddress: true,
            buyerNote: true,
            store: { select: { id: true, name: true, latitude: true, longitude: true, phone: true } },
          },
        },
      },
    });
  }

  async getRiderDeliveryByOrderId(userId: string, orderId: string) {
    const riderProfile = await this.requireRiderProfile(userId);

    const delivery = await this.prisma.delivery.findFirst({
      where: { orderId, riderProfileId: riderProfile.id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentMethod: true,
            totalAmount: true,
            deliveryAddress: true,
            deliveryLat: true,
            deliveryLng: true,
            buyerNote: true,
            store: { select: { id: true, name: true, latitude: true, longitude: true, phone: true } },
            items: { select: { productName: true, variantName: true, quantity: true } },
          },
        },
        assignments: { orderBy: { offeredAt: 'desc' }, take: 1 },
      },
    });

    if (!delivery) throw new NotFoundException('Delivery not found or not assigned to you');
    return delivery;
  }

  // ── Accept assignment ────────────────────────────────────────────────────

  async acceptDelivery(userId: string, orderId: string, ipAddress?: string) {
    const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);

    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      throw new BadRequestException(
        `Cannot accept: delivery is in status ${delivery.status}. Expected: ASSIGNED`,
      );
    }

    // Check the order is still READY_FOR_PICKUP or RIDER_ASSIGNED (between assign and accept window)
    const acceptableOrderStatuses = new Set<string>([OrderStatus.READY_FOR_PICKUP, OrderStatus.RIDER_ASSIGNED]);
    if (!acceptableOrderStatuses.has(delivery.order.status as string)) {
      throw new BadRequestException('Order is no longer available for acceptance');
    }

    await this.applyTransition(delivery, DeliveryStatus.ACCEPTED, userId, ipAddress);

    return { deliveryId: delivery.id, status: DeliveryStatus.ACCEPTED };
  }

  // ── Arrived at store ─────────────────────────────────────────────────────

  async arrivedAtStore(userId: string, orderId: string, ipAddress?: string) {
    const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
    this.assertCanAdvance(delivery.status, DeliveryStatus.ARRIVED_AT_STORE);

    await this.applyTransition(delivery, DeliveryStatus.ARRIVED_AT_STORE, userId, ipAddress);
    return { deliveryId: delivery.id, status: DeliveryStatus.ARRIVED_AT_STORE };
  }

  // ── Picked up from store ─────────────────────────────────────────────────

  async pickedUp(userId: string, orderId: string, ipAddress?: string) {
    const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
    this.assertCanAdvance(delivery.status, DeliveryStatus.PICKED_UP);

    await this.applyTransition(delivery, DeliveryStatus.PICKED_UP, userId, ipAddress);
    return { deliveryId: delivery.id, status: DeliveryStatus.PICKED_UP };
  }

  // ── Arrived at customer ─────────────────────────────────────────────────

  async arrivedAtCustomer(userId: string, orderId: string, ipAddress?: string) {
    const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
    this.assertCanAdvance(delivery.status, DeliveryStatus.ARRIVED_AT_CUSTOMER);

    await this.applyTransition(delivery, DeliveryStatus.ARRIVED_AT_CUSTOMER, userId, ipAddress);
    return { deliveryId: delivery.id, status: DeliveryStatus.ARRIVED_AT_CUSTOMER };
  }

  // ── Mark delivered ───────────────────────────────────────────────────────

  async markDelivered(userId: string, orderId: string, ipAddress?: string) {
    const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
    this.assertCanAdvance(delivery.status, DeliveryStatus.DELIVERED);

    await this.applyTransition(delivery, DeliveryStatus.DELIVERED, userId, ipAddress);
    return { deliveryId: delivery.id, status: DeliveryStatus.DELIVERED };
  }

  // ── Mark failed ─────────────────────────────────────────────────────────

  async markFailed(userId: string, orderId: string, reason?: string, ipAddress?: string) {
    const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);

    if (TERMINAL_DELIVERY.has(delivery.status)) {
      throw new BadRequestException(`Delivery already in terminal status: ${delivery.status}`);
    }

    const riderProfile = await this.prisma.riderProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    await this.prisma.$transaction([
      this.prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.FAILED },
      }),
      this.prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.DELIVERY_FAILED },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: delivery.orderId,
          status: OrderStatus.DELIVERY_FAILED,
          note: reason ?? 'Delivery failed',
          changedBy: userId,
        },
      }),
      // Release rider back to ONLINE
      this.prisma.riderProfile.update({
        where: { id: riderProfile!.id },
        data: { status: RiderStatus.ONLINE },
      }),
    ]);

    await Promise.all([
      this.audit.log({
        actorId: userId,
        action: 'DELIVERY_FAILED',
        resourceType: 'delivery',
        resourceId: delivery.id,
        ipAddress,
        metadata: { orderId: delivery.orderId, reason } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.DELIVERY_FAILED,
        'delivery',
        delivery.id,
        { orderId: delivery.orderId, reason } as Prisma.InputJsonValue,
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    return { deliveryId: delivery.id, status: DeliveryStatus.FAILED };
  }

  // ── Private: apply transition ─────────────────────────────────────────────

  private async applyTransition(
    delivery: { id: string; orderId: string; riderProfileId: string | null },
    toStatus: DeliveryStatus,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    const now = new Date();
    const riderProfileId = delivery.riderProfileId!;

    const orderStatusUpdate = DELIVERY_TO_ORDER_STATUS[toStatus];
    const auditAction = AUDIT_ACTIONS[toStatus];

    const deliveryData: Prisma.DeliveryUpdateInput = {
      status: toStatus,
      ...(toStatus === DeliveryStatus.PICKED_UP && { pickedUpAt: now }),
      ...(toStatus === DeliveryStatus.DELIVERED && { deliveredAt: now }),
    };

    const operations: any[] = [
      this.prisma.delivery.update({ where: { id: delivery.id }, data: deliveryData }),
    ];

    // Sync order status
    if (orderStatusUpdate) {
      operations.push(
        this.prisma.order.update({
          where: { id: delivery.orderId },
          data: {
            status: orderStatusUpdate,
            ...(orderStatusUpdate === OrderStatus.DELIVERED && { completedAt: now }),
          },
        }),
        this.prisma.orderStatusHistory.create({
          data: {
            orderId: delivery.orderId,
            status: orderStatusUpdate,
            note: `Delivery: ${toStatus}`,
            changedBy: actorId,
          },
        }),
      );
    }

    // On delivery completion, update rider stats and set to ONLINE
    if (toStatus === DeliveryStatus.DELIVERED) {
      operations.push(
        this.prisma.riderProfile.update({
          where: { id: riderProfileId },
          data: {
            status: RiderStatus.ONLINE,
            totalDeliveries: { increment: 1 },
          },
        }),
      );
    }

    // On accept, update the assignment record
    if (toStatus === DeliveryStatus.ACCEPTED) {
      operations.push(
        this.prisma.deliveryAssignment.updateMany({
          where: {
            deliveryId: delivery.id,
            riderProfileId,
            status: AssignmentStatus.OFFERED,
          },
          data: { status: AssignmentStatus.ACCEPTED, respondedAt: now },
        }),
        // Rider transitions to ON_DELIVERY
        this.prisma.riderProfile.update({
          where: { id: riderProfileId },
          data: { status: RiderStatus.ON_DELIVERY },
        }),
      );
    }

    await this.prisma.$transaction(operations);

    // Audit + domain events
    if (auditAction) {
      void this.audit.log({
        actorId,
        action: auditAction,
        resourceType: 'delivery',
        resourceId: delivery.id,
        ipAddress,
        metadata: { orderId: delivery.orderId, newStatus: toStatus } as Prisma.InputJsonValue,
      });
    }

    const eventType = this.toDomainEvent(toStatus);
    if (eventType) {
      void this.domainEvents.emit(
        eventType,
        'delivery',
        delivery.id,
        { orderId: delivery.orderId, riderProfileId } as Prisma.InputJsonValue,
        { userId: actorId, ipAddress: ipAddress ?? null },
      );
    }

    this.logger.log({ deliveryId: delivery.id, toStatus }, 'Delivery status advanced');
  }

  private assertCanAdvance(current: DeliveryStatus, to: DeliveryStatus): void {

    if (TERMINAL_DELIVERY.has(current)) {
      throw new BadRequestException(`Delivery is in terminal status: ${current}`);
    }
    const expected = DELIVERY_NEXT[current];
    if (expected !== to) {
      throw new BadRequestException(
        `Invalid transition: ${current} → ${to}. Expected: ${expected ?? 'none'}`,
      );
    }
  }

  private toDomainEvent(status: DeliveryStatus): DomainEventType | null {
    const map: Partial<Record<DeliveryStatus, DomainEventType>> = {
      [DeliveryStatus.ACCEPTED]: DomainEventType.RIDER_ACCEPTED,
      [DeliveryStatus.PICKED_UP]: DomainEventType.ORDER_PICKED_UP,
      [DeliveryStatus.DELIVERED]: DomainEventType.ORDER_DELIVERED,
    };
    return map[status] ?? null;
  }

  // ── Private: ownership helpers ────────────────────────────────────────────

  async requireRiderProfile(userId: string) {
    const rp = await this.prisma.riderProfile.findUnique({
      where: { userId },
      select: { id: true, status: true, kycStatus: true },
    });
    if (!rp) throw new NotFoundException('Rider profile not found');
    if (rp.kycStatus !== KycStatus.APPROVED) {
      throw new ForbiddenException('Rider KYC not approved');
    }
    return rp;
  }

  private async requireRiderOwnershipByOrder(userId: string, orderId: string) {
    const rp = await this.requireRiderProfile(userId);

    const delivery = await this.prisma.delivery.findFirst({
      where: { orderId, riderProfileId: rp.id },
      select: {
        id: true,
        orderId: true,
        status: true,
        riderProfileId: true,
        order: { select: { status: true } },
      },
    });

    if (!delivery) throw new ForbiddenException('Delivery not assigned to you');
    return delivery;
  }
}

