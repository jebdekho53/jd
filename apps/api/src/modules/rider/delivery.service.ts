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
  Prisma,
  RiderStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { activeDeliveryStatuses } from '../rider-assignment/rider-assignment.util';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { SettlementService } from '../settlement/settlement.service';
import { CodReconciliationService } from '../finance/cod-reconciliation.service';
import { ReservationService } from '../checkout/reservation.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { TRACKING_EVENTS } from '../delivery-tracking/delivery-tracking.events';
import { WalletLoyaltyCheckoutService } from '../wallet-loyalty/wallet-loyalty-checkout.service';
import { ReferralService } from '../wallet-loyalty/referral.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { InvoiceEngineService } from '../compliance/invoice-engine.service';
import { TdsTcsService } from '../compliance/tds-tcs.service';
import { TrustSafetyHookService } from '../trust-safety/trust-safety-hook.service';

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
    private readonly settlement: SettlementService,
    private readonly cod: CodReconciliationService,
    private readonly reservation: ReservationService,
    private readonly statusHistory: OrderStatusHistoryService,
    private readonly tracking: DeliveryTrackingService,
    private readonly walletLoyalty: WalletLoyaltyCheckoutService,
    private readonly referral: ReferralService,
    private readonly invoiceEngine: InvoiceEngineService,
    private readonly tdsTcs: TdsTcsService,
    private readonly trustSafety: TrustSafetyHookService,
    private readonly emailNotifications: EmailNotificationService,
  ) {}

  // ── Get delivery for a rider ───────────────────────────────────────────────

  async getRiderDeliveries(userId: string) {
    const riderProfile = await this.requireRiderProfile(userId);

    return this.prisma.delivery.findMany({
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

    if (toStatus === DeliveryStatus.DELIVERED) {
      void this.settlement.createLedgerForDeliveredOrder(delivery.orderId, actorId).catch((err) => {
        this.logger.error({ err, orderId: delivery.orderId }, 'Settlement creation failed');
      });
      void this.cod.createForDeliveredOrder(delivery.orderId, riderProfileId).catch((err) => {
        this.logger.error({ err, orderId: delivery.orderId }, 'COD reconciliation failed');
      });
      void this.applyRiderEarningFromSnapshot(delivery.id, delivery.orderId).catch(() => {});
      void this.reservation.fulfillOnDelivery(delivery.orderId).catch((err) => {
        this.logger.error({ err, orderId: delivery.orderId }, 'Inventory fulfillment on delivery failed');
      });
      void this.finalizeOrderRewards(delivery.orderId, actorId).catch((err) => {
        this.logger.error({ err, orderId: delivery.orderId }, 'Order rewards finalization failed');
      });
      void this.invoiceEngine.generateForOrder(delivery.orderId).catch((err) => {
        this.logger.error({ err, orderId: delivery.orderId }, 'GST invoice generation failed');
      });
      void this.syncMonthlyTdsTcs().catch(() => {});
      void this.trustSafety.onOrderDelivered(delivery.orderId, riderProfileId).catch(() => {});
      void this.emailNotifications.sendOrderDelivered(delivery.orderId).catch((err) => {
        this.logger.error({ err, orderId: delivery.orderId }, 'Order delivered email failed');
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

  private async finalizeOrderRewards(orderId: string, actorId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerProfileId: true, status: true },
    });
    if (!order || order.status === OrderStatus.COMPLETED) return;

    await this.statusHistory.transition({
      orderId,
      toStatus: OrderStatus.COMPLETED,
      actorType: OrderActorType.SYSTEM,
      actorId,
      note: 'Order completed after delivery',
      skipIfAlreadyStatus: true,
    });

    void this.domainEvents.emit(
      DomainEventType.ORDER_COMPLETED,
      'order',
      orderId,
      { buyerProfileId: order.buyerProfileId },
      { userId: actorId },
    );

    await this.walletLoyalty.processOrderCompleted(orderId);
    await this.referral.completeReferralOnFirstOrder(order.buyerProfileId, orderId);
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

  private async applyRiderEarningFromSnapshot(deliveryId: string, orderId: string) {
    const snap = await this.prisma.orderFinancialSnapshot.findUnique({
      where: { orderId },
      select: { riderPayoutAmount: true },
    });
    if (!snap) return;
    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { riderEarning: snap.riderPayoutAmount },
    });
  }

  private async syncMonthlyTdsTcs() {
    const now = new Date();
    const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await this.tdsTcs.syncMonthlyFromInvoices(periodMonth);
  }
}

