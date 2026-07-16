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
  OrderActorType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  RiderStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { HANDOVER_OTP_MAX_ATTEMPTS, otpMatches } from './delivery-otp.util';
import { activeDeliveryStatuses } from '../rider-assignment/rider-assignment.util';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderDeliveredHandlerService } from '../order/order-delivered-handler.service';
import { ReservationService } from '../checkout/reservation.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { TRACKING_EVENTS } from '../delivery-tracking/delivery-tracking.events';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';

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

// Payment methods that require the rider to physically collect cash at the door.
const COD_METHODS = new Set<PaymentMethod>([PaymentMethod.COD, PaymentMethod.WALLET_COD]);

// Map delivery status → corresponding Order status update (only steps that change order status)
const DELIVERY_TO_ORDER_STATUS: Partial<Record<DeliveryStatus, OrderStatus>> = {
  [DeliveryStatus.PICKED_UP]: OrderStatus.PICKED_UP,
  [DeliveryStatus.DELIVERED]: OrderStatus.DELIVERED,
};

// Delivery milestones recorded in timeline without changing order.status
const DELIVERY_MILESTONE: Partial<Record<DeliveryStatus, string>> = {
  [DeliveryStatus.ARRIVED_AT_STORE]: 'ARRIVED_AT_STORE',
  [DeliveryStatus.ARRIVED_AT_CUSTOMER]: 'ARRIVED_AT_CUSTOMER',
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
    private readonly orderDelivered: OrderDeliveredHandlerService,
    private readonly reservation: ReservationService,
    private readonly statusHistory: OrderStatusHistoryService,
    private readonly tracking: DeliveryTrackingService,
    private readonly buyerPush: BuyerPushNotificationService,
  ) {}

  // ── Get delivery for a rider ───────────────────────────────────────────────

  async getRiderDeliveries(userId: string) {
    const riderProfile = await this.requireRiderProfile(userId);

    const deliveries = await this.prisma.delivery.findMany({
      where: {
        riderProfileId: riderProfile.id,
        status: { in: activeDeliveryStatuses() },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentMethod: true,
            paymentStatus: true,
            totalAmount: true,
            deliveryAddress: true,
            buyerNote: true,
            store: { select: { id: true, name: true, latitude: true, longitude: true, phone: true } },
          },
        },
      },
    });
    return deliveries.map((d) => this.sanitizeForRider(d));
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
            paymentStatus: true,
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
    return this.sanitizeForRider(delivery);
  }

  /**
   * Strip the raw handover codes (the rider must NEVER see them) and surface
   * only rider-safe derived state: whether each OTP is required/verified and the
   * server-authoritative cash-on-delivery amount to collect.
   */
  private sanitizeForRider<
    T extends {
      pickupOtp?: string | null;
      deliveryOtp?: string | null;
      pickupVerifiedAt?: Date | null;
      deliveryVerifiedAt?: Date | null;
      order?: {
        paymentMethod?: PaymentMethod;
        paymentStatus?: PaymentStatus;
        totalAmount?: Prisma.Decimal;
      } | null;
    },
  >(delivery: T) {
    const {
      pickupOtp,
      deliveryOtp,
      ...rest
    } = delivery as T & { pickupOtp?: string | null; deliveryOtp?: string | null };

    const order = delivery.order ?? null;
    const codDue =
      order?.paymentMethod &&
      COD_METHODS.has(order.paymentMethod) &&
      order.paymentStatus !== PaymentStatus.PAID;

    return {
      ...rest,
      pickupOtpRequired: Boolean(pickupOtp),
      pickupVerified: Boolean(delivery.pickupVerifiedAt),
      deliveryOtpRequired: Boolean(deliveryOtp),
      deliveryVerified: Boolean(delivery.deliveryVerifiedAt),
      codDue: Boolean(codDue),
      codAmount: codDue && order?.totalAmount ? order.totalAmount.toString() : null,
    };
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

    // OTP-enabled deliveries must be confirmed through verifyPickup so the code
    // can't be bypassed via the plain endpoint.
    if (delivery.pickupOtp && !delivery.pickupVerifiedAt) {
      throw new BadRequestException('Pickup requires handover OTP verification');
    }

    await this.applyTransition(delivery, DeliveryStatus.PICKED_UP, userId, ipAddress);
    return { deliveryId: delivery.id, status: DeliveryStatus.PICKED_UP };
  }

  // ── Verify pickup (merchant handover OTP) ─────────────────────────────────

  async verifyPickup(userId: string, orderId: string, otp: string, ipAddress?: string) {
    const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
    this.assertCanAdvance(delivery.status, DeliveryStatus.PICKED_UP);

    await this.assertOtpOrThrow(delivery, 'pickup', otp, userId, ipAddress);
    await this.applyTransition(delivery, DeliveryStatus.PICKED_UP, userId, ipAddress);
    return { deliveryId: delivery.id, status: DeliveryStatus.PICKED_UP, pickupVerified: true };
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

    // OTP-enabled deliveries must be confirmed through verifyDelivery.
    if (delivery.deliveryOtp && !delivery.deliveryVerifiedAt) {
      throw new BadRequestException('Delivery requires customer OTP verification');
    }
    this.assertCodAcknowledged(delivery, false);

    await this.applyTransition(delivery, DeliveryStatus.DELIVERED, userId, ipAddress);
    return { deliveryId: delivery.id, status: DeliveryStatus.DELIVERED };
  }

  // ── Verify delivery (buyer OTP + COD acknowledgment) ──────────────────────

  async verifyDelivery(
    userId: string,
    orderId: string,
    otp: string,
    codCollected: boolean,
    ipAddress?: string,
  ) {
    const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
    this.assertCanAdvance(delivery.status, DeliveryStatus.DELIVERED);

    // Cash must be acknowledged before the OTP is even checked so a rider can't
    // mark a COD order delivered without confirming collection.
    this.assertCodAcknowledged(delivery, codCollected);
    await this.assertOtpOrThrow(delivery, 'delivery', otp, userId, ipAddress);
    await this.applyTransition(delivery, DeliveryStatus.DELIVERED, userId, ipAddress);
    return {
      deliveryId: delivery.id,
      status: DeliveryStatus.DELIVERED,
      deliveryVerified: true,
      codCollected: this.isCodDue(delivery) ? true : false,
    };
  }

  /** Amount the rider must collect at the door (server-authoritative), or null. */
  private isCodDue(delivery: {
    order: { paymentMethod: PaymentMethod; paymentStatus: PaymentStatus };
  }): boolean {
    return (
      COD_METHODS.has(delivery.order.paymentMethod) &&
      delivery.order.paymentStatus !== PaymentStatus.PAID
    );
  }

  /**
   * Reject completion of a COD order unless the rider explicitly acknowledged
   * cash collection. The amount is never taken from the client — it is the
   * server's order.totalAmount.
   */
  private assertCodAcknowledged(
    delivery: {
      order: { paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; totalAmount: Prisma.Decimal };
    },
    codCollected: boolean,
  ): void {
    if (this.isCodDue(delivery) && !codCollected) {
      throw new BadRequestException(
        `Cash collection of ₹${delivery.order.totalAmount.toString()} must be acknowledged before completing this COD delivery`,
      );
    }
  }

  /**
   * Verify a handover OTP with one-time-use and brute-force protection.
   * Idempotent: if already verified, returns without re-checking.
   */
  private async assertOtpOrThrow(
    delivery: {
      id: string;
      orderId: string;
      pickupOtp: string | null;
      pickupVerifiedAt: Date | null;
      pickupOtpAttempts: number;
      deliveryOtp: string | null;
      deliveryVerifiedAt: Date | null;
      deliveryOtpAttempts: number;
    },
    kind: 'pickup' | 'delivery',
    submitted: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    const stored = kind === 'pickup' ? delivery.pickupOtp : delivery.deliveryOtp;
    const verifiedAt = kind === 'pickup' ? delivery.pickupVerifiedAt : delivery.deliveryVerifiedAt;
    const attempts = kind === 'pickup' ? delivery.pickupOtpAttempts : delivery.deliveryOtpAttempts;

    if (verifiedAt) return; // one-time use — already verified

    if (!stored) {
      throw new BadRequestException('No handover code is set for this delivery');
    }
    if (attempts >= HANDOVER_OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Too many incorrect attempts. Contact support to complete this handover.',
      );
    }

    if (!otpMatches(submitted, stored)) {
      const nextAttempts = attempts + 1;
      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data:
          kind === 'pickup'
            ? { pickupOtpAttempts: nextAttempts }
            : { deliveryOtpAttempts: nextAttempts },
      });
      void this.audit.log({
        actorId,
        action: kind === 'pickup' ? 'PICKUP_OTP_FAILED' : 'DELIVERY_OTP_FAILED',
        resourceType: 'delivery',
        resourceId: delivery.id,
        ipAddress,
        metadata: { orderId: delivery.orderId, attempts: nextAttempts } as Prisma.InputJsonValue,
      });
      const remaining = Math.max(0, HANDOVER_OTP_MAX_ATTEMPTS - nextAttempts);
      throw new BadRequestException(
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Incorrect code. Contact support to complete this handover.',
      );
    }

    // Success — record one-time-use marker.
    await this.prisma.delivery.update({
      where: { id: delivery.id },
      data:
        kind === 'pickup'
          ? { pickupVerifiedAt: new Date() }
          : { deliveryVerifiedAt: new Date() },
    });
    void this.audit.log({
      actorId,
      action: kind === 'pickup' ? 'PICKUP_OTP_VERIFIED' : 'DELIVERY_OTP_VERIFIED',
      resourceType: 'delivery',
      resourceId: delivery.id,
      ipAddress,
      metadata: { orderId: delivery.orderId } as Prisma.InputJsonValue,
    });
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
      ...(toStatus === DeliveryStatus.ARRIVED_AT_STORE && { arrivedAtStoreAt: now }),
      ...(toStatus === DeliveryStatus.PICKED_UP && { pickedUpAt: now }),
      ...(toStatus === DeliveryStatus.ARRIVED_AT_CUSTOMER && { arrivedAtCustomerAt: now }),
      ...(toStatus === DeliveryStatus.DELIVERED && { deliveredAt: now }),
    };

    await this.prisma.delivery.update({ where: { id: delivery.id }, data: deliveryData });

    const milestone = DELIVERY_MILESTONE[toStatus];
    if (milestone) {
      const order = await this.prisma.order.findUnique({
        where: { id: delivery.orderId },
        select: { status: true },
      });
      if (order) {
        await this.statusHistory.appendEntry({
          orderId: delivery.orderId,
          status: order.status,
          actorType: OrderActorType.RIDER,
          actorId,
          note: `Delivery milestone: ${milestone}`,
          metadata: { milestone } as Prisma.InputJsonValue,
        });
      }
    }

    if (orderStatusUpdate) {
      await this.statusHistory.transition({
        orderId: delivery.orderId,
        toStatus: orderStatusUpdate,
        actorType: OrderActorType.RIDER,
        actorId,
        note: `Delivery: ${toStatus}`,
        skipIfAlreadyStatus: true,
      });
    }
    if (toStatus === DeliveryStatus.DELIVERED) {
      await this.prisma.riderProfile.update({
        where: { id: riderProfileId },
        data: {
          status: RiderStatus.ONLINE,
          totalDeliveries: { increment: 1 },
        },
      });
    }

    if (toStatus === DeliveryStatus.ACCEPTED) {
      await this.prisma.deliveryAssignment.updateMany({
        where: {
          deliveryId: delivery.id,
          riderProfileId,
          status: AssignmentStatus.OFFERED,
        },
        data: { status: AssignmentStatus.ACCEPTED, respondedAt: now },
      });
      await this.prisma.riderProfile.update({
        where: { id: riderProfileId },
        data: { status: RiderStatus.ON_DELIVERY },
      });
    }
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

    if (toStatus === DeliveryStatus.PICKED_UP) {
      void this.buyerPush.notifyOutForDelivery(delivery.orderId).catch(() => {});
    }

    if (toStatus === DeliveryStatus.DELIVERED) {
      void this.orderDelivered.handleDelivered({
        orderId: delivery.orderId,
        actorId,
        riderProfileId,
        deliveryId: delivery.id,
      }).catch((err) => {
        this.logger.error({ err, orderId: delivery.orderId }, 'Order delivered handler failed');
      });
    }

    const orderMeta = await this.prisma.order.findUnique({
      where: { id: delivery.orderId },
      select: { orderNumber: true, storeId: true, status: true },
    });
    if (orderMeta) {
      this.tracking.emitOrderStatus({
        orderId: delivery.orderId,
        orderNumber: orderMeta.orderNumber,
        storeId: orderMeta.storeId,
        riderProfileId,
        orderStatus: orderMeta.status,
        deliveryStatus: toStatus,
      });

      if (toStatus === DeliveryStatus.ACCEPTED || toStatus === DeliveryStatus.PICKED_UP) {
        this.tracking.emitDeliveryEvent('STARTED', {
          orderId: delivery.orderId,
          orderNumber: orderMeta.orderNumber,
          storeId: orderMeta.storeId,
          riderProfileId,
          deliveryStatus: toStatus,
          orderStatus: orderMeta.status,
        });
      }
      if (
        toStatus === DeliveryStatus.ARRIVED_AT_STORE ||
        toStatus === DeliveryStatus.ARRIVED_AT_CUSTOMER
      ) {
        this.tracking.emitDeliveryEvent('ARRIVED', {
          orderId: delivery.orderId,
          orderNumber: orderMeta.orderNumber,
          storeId: orderMeta.storeId,
          riderProfileId,
          deliveryStatus: toStatus,
          orderStatus: orderMeta.status,
        });
      }
      if (toStatus === DeliveryStatus.DELIVERED) {
        this.tracking.emitDeliveryEvent('COMPLETED', {
          orderId: delivery.orderId,
          orderNumber: orderMeta.orderNumber,
          storeId: orderMeta.storeId,
          riderProfileId,
          deliveryStatus: toStatus,
          orderStatus: orderMeta.status,
        });
      }
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
        pickupOtp: true,
        pickupVerifiedAt: true,
        pickupOtpAttempts: true,
        deliveryOtp: true,
        deliveryVerifiedAt: true,
        deliveryOtpAttempts: true,
        order: {
          select: {
            status: true,
            paymentMethod: true,
            paymentStatus: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!delivery) throw new ForbiddenException('Delivery not assigned to you');
    return delivery;
  }
}

