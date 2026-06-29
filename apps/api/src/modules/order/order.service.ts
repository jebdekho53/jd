import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  DomainEventType,
  FoodKitchenStatus,
  OrderActorType,
  OrderStatus,
  OrderVertical,
  PaymentMethod,
  PaymentStatus,
  OrderRefundInitiator,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderCacheService } from './order-cache.service';
import { OrderStatusHistoryService } from './order-status-history.service';
import { buildMerchantListWhere } from './merchant-order-visibility.util';
import { merchantForwardMap } from './merchant-forward.util';
import { BUYER_STATUS_GROUPS } from './order-status-groups';
import {
  PIPELINE_COLUMN_STATUSES,
  resolvePipelineColumn,
  SLA_THRESHOLDS,
  minutesSince,
  slaLevel,
  type MerchantPipelineColumn,
} from './merchant-pipeline.util';
import { merchantOrderDayFilter, orderIstDayFilter } from '../../common/utils/ist-day.util';
import { DeliveryDispatchService } from '../logistics/delivery-dispatch.service';
import { ReservationService } from '../checkout/reservation.service';
import { OrderRefundService } from '../payment/order-refund.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { ListOrdersDto, ListMerchantOrdersDto, ListAdminOrdersDto } from './dto/list-orders.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import {
  auditDeliveryCoordinates,
  computeDeliveryEta,
  safeDistanceKm,
} from '../../common/utils/delivery-eta.util';

// ── State machine ────────────────────────────────────────────────────────────
//
// These are the valid one-step forward transitions for the merchant-driven flow.
// COD orders start at MERCHANT_ACCEPTED (already "confirmed" at creation).

const MERCHANT_FORWARD: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.CREATED]: OrderStatus.MERCHANT_ACCEPTED,
  [OrderStatus.PAID]: OrderStatus.MERCHANT_ACCEPTED,
  [OrderStatus.MERCHANT_ACCEPTED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.PACKING,
  [OrderStatus.PACKING]: OrderStatus.READY_FOR_PICKUP,
};

// Statuses from which a buyer is allowed to cancel (before merchant confirms)
const BUYER_CANCELLABLE = new Set<OrderStatus>([
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PAID,
]);

// Statuses from which a merchant is allowed to cancel (before ready-for-pickup)
const MERCHANT_CANCELLABLE = new Set<OrderStatus>([
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PAID,
  OrderStatus.MERCHANT_ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.PACKING,
]);

// Terminal statuses — no further transitions allowed
const TERMINAL = new Set<OrderStatus>([
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED_BY_BUYER,
  OrderStatus.CANCELLED_BY_MERCHANT,
  OrderStatus.CANCELLED_BY_ADMIN,
  OrderStatus.PAYMENT_FAILED,
  OrderStatus.REFUNDED,
]);

const ADMIN_STATUS_GROUPS = {
  pending: [
    OrderStatus.PAYMENT_PENDING,
    OrderStatus.PAID,
    OrderStatus.CREATED,
    OrderStatus.MERCHANT_ACCEPTED,
  ],
  preparing: [OrderStatus.PREPARING, OrderStatus.PACKING],
  ready_for_pickup: [OrderStatus.READY_FOR_PICKUP],
  assigned: [OrderStatus.RIDER_ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY],
  delivered: [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
  cancelled: [
    OrderStatus.CANCELLED_BY_BUYER,
    OrderStatus.CANCELLED_BY_MERCHANT,
    OrderStatus.CANCELLED_BY_ADMIN,
  ],
} as const satisfies Record<string, OrderStatus[]>;

// Prisma select for a full order detail (buyer + merchant view)
const ORDER_DETAIL_SELECT = {
  id: true,
  orderNumber: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  subtotal: true,
  discountAmount: true,
  deliveryFee: true,
  taxAmount: true,
  totalAmount: true,
  deliveryAddress: true,
  deliveryLat: true,
  deliveryLng: true,
  buyerNote: true,
  cancelReason: true,
  paidAt: true,
  completedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      latitude: true,
      longitude: true,
      merchantProfile: { select: { id: true, businessName: true } },
    },
  },
  buyerProfile: {
    select: {
      id: true,
      name: true,
      user: { select: { phone: true } },
    },
  },
  items: {
    select: {
      id: true,
      productName: true,
      variantName: true,
      sku: true,
      quantity: true,
      unitPrice: true,
      discount: true,
      totalPrice: true,
    },
  },
  statusHistory: {
    select: {
      status: true,
      note: true,
      changedBy: true,
      actorType: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  payment: { select: { razorpayOrderId: true, razorpayPaymentId: true, status: true, method: true } },
  review: {
    select: {
      id: true,
      rating: true,
      storeExperience: true,
      deliveryExperience: true,
      productQuality: true,
      title: true,
      comment: true,
      images: true,
      verifiedPurchase: true,
      merchantReply: true,
      merchantRepliedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  delivery: {
    select: {
      id: true,
      status: true,
      pickupLat: true,
      pickupLng: true,
      deliveryLat: true,
      deliveryLng: true,
      distanceKm: true,
      estimatedMins: true,
      estimatedArrivalAt: true,
      riderProfileId: true,
      assignedAt: true,
      arrivedAtStoreAt: true,
      pickedUpAt: true,
      arrivedAtCustomerAt: true,
      deliveredAt: true,
      riderProfile: {
        select: {
          id: true,
          name: true,
          vehicleType: true,
          status: true,
          currentLat: true,
          currentLng: true,
          lastLocationAt: true,
          user: { select: { phone: true } },
        },
      },
      assignments: {
        select: {
          id: true,
          status: true,
          offeredAt: true,
          respondedAt: true,
          expiresAt: true,
          riderProfile: { select: { id: true, name: true } },
        },
        orderBy: { offeredAt: 'asc' as const },
      },
    },
  },
} satisfies Prisma.OrderSelect;

@Injectable()
export class OrderService implements OnModuleInit {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly cache: OrderCacheService,
    private readonly statusHistory: OrderStatusHistoryService,
    private readonly deliveryDispatch: DeliveryDispatchService,
    private readonly reservation: ReservationService,
    private readonly orderRefunds: OrderRefundService,
    private readonly buyerPush: BuyerPushNotificationService,
    private readonly deliveryTracking: DeliveryTrackingService,
  ) {}

  // ── Buyer: list orders ────────────────────────────────────────────────────

  async listBuyerOrders(userId: string, dto: ListOrdersDto) {
    const bp = await this.requireBuyerProfile(userId);
    const { page = 1, limit = 20, status, statusGroup } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      buyerProfileId: bp.id,
      ...(status && { status }),
      ...(statusGroup && !status && { status: { in: [...BUYER_STATUS_GROUPS[statusGroup]] } }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
          store: { select: { name: true, slug: true } },
          items: { select: { productName: true, quantity: true }, take: 3 },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    this.logger.log(
      `listBuyerOrders buyer=${bp.id} status=${status ?? 'all'} → ${total} orders`,
    );

    return {
      orders: orders.map(serializeListItem),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Buyer: get order detail ───────────────────────────────────────────────

  async onModuleInit() {
    void this.auditActiveDeliveryCoordinates();
  }

  async getBuyerOrder(userId: string, orderId: string) {
    const bp = await this.requireBuyerProfile(userId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerProfileId: bp.id },
      select: ORDER_DETAIL_SELECT,
    });
    if (!order) throw new NotFoundException('Order not found');

    this.logDeliveryCoordinateWarnings(order);

    const view = serializeDetail(order);
    void this.cache.setDetail(orderId, view);
    return view;
  }

  private logDeliveryCoordinateWarnings(order: {
    id: string;
    orderNumber: string;
    status: string;
    deliveryLat: number;
    deliveryLng: number;
    store: { latitude: number; longitude: number } | null;
    delivery: {
      distanceKm: number | null;
      riderProfile: { currentLat: number | null; currentLng: number | null } | null;
    } | null;
  }) {
    if (!order.delivery) return;
    const warnings = auditDeliveryCoordinates({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      storeLat: order.store?.latitude,
      storeLng: order.store?.longitude,
      customerLat: order.deliveryLat,
      customerLng: order.deliveryLng,
      riderLat: order.delivery.riderProfile?.currentLat,
      riderLng: order.delivery.riderProfile?.currentLng,
      deliveryDistanceKm:
        order.delivery.distanceKm != null ? Number(order.delivery.distanceKm) : null,
    });
    for (const warning of warnings) {
      this.logger.warn(`[delivery-coord-audit] ${warning}`);
    }
  }

  private async auditActiveDeliveryCoordinates() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: [
            OrderStatus.RIDER_ASSIGNED,
            OrderStatus.PICKED_UP,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
        delivery: { isNot: null },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        deliveryLat: true,
        deliveryLng: true,
        store: { select: { latitude: true, longitude: true } },
        delivery: {
          select: {
            distanceKm: true,
            riderProfile: { select: { currentLat: true, currentLng: true } },
          },
        },
      },
      take: 500,
    });

    let issueCount = 0;
    for (const order of orders) {
      const warnings = auditDeliveryCoordinates({
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        storeLat: order.store?.latitude,
        storeLng: order.store?.longitude,
        customerLat: order.deliveryLat,
        customerLng: order.deliveryLng,
        riderLat: order.delivery?.riderProfile?.currentLat,
        riderLng: order.delivery?.riderProfile?.currentLng,
        deliveryDistanceKm:
          order.delivery?.distanceKm != null ? Number(order.delivery.distanceKm) : null,
      });
      for (const warning of warnings) {
        issueCount += 1;
        this.logger.warn(`[delivery-coord-audit] ${warning}`);
      }
    }
    if (issueCount > 0) {
      this.logger.warn(
        `[delivery-coord-audit] Found ${issueCount} coordinate issue(s) across ${orders.length} active delivery order(s)`,
      );
    }
  }

  // ── Buyer: cancel order ───────────────────────────────────────────────────

  async cancelByBuyer(userId: string, orderId: string, dto: CancelOrderDto, ipAddress?: string) {
    const bp = await this.requireBuyerProfile(userId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerProfileId: bp.id },
      select: { id: true, status: true, paymentMethod: true, paymentStatus: true, orderNumber: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!BUYER_CANCELLABLE.has(order.status)) {
      throw new BadRequestException(
        `Order cannot be cancelled in status: ${order.status}. ` +
        `Buyer cancellation is only allowed before the merchant confirms the order (PAID).`,
      );
    }

    const newStatus = OrderStatus.CANCELLED_BY_BUYER;
    await this.statusHistory.transition({
      orderId: order.id,
      toStatus: newStatus,
      actorType: OrderActorType.BUYER,
      actorId: userId,
      note: dto.reason,
    });
    await this.reservation.releaseOrderReservations(order.id, userId);

    // Trigger refund for any paid order with refundable balance
    if (order.paymentStatus === PaymentStatus.PAID) {
      await this.orderRefunds.initiateRefund({
        orderId: order.id,
        actorId: userId,
        initiatorType: OrderRefundInitiator.BUYER,
        reason: dto.reason,
        ipAddress,
      });
    }

    void this.cache.invalidateAll(orderId);

    this.logger.log({ userId, orderId, orderNumber: order.orderNumber }, 'Order cancelled by buyer');
    return { orderId, status: newStatus };
  }

  // ── Merchant: list orders ─────────────────────────────────────────────────

  async listMerchantOrders(userId: string, dto: ListMerchantOrdersDto) {
    const storeIds = await this.getMerchantStoreIds(userId);
    if (storeIds.length === 0) return { orders: [], meta: { page: dto.page ?? 1, limit: dto.limit ?? 20, total: 0, totalPages: 0 } };

    const {
      page = 1,
      limit = 20,
      status,
      storeId,
      merchantStatusGroup,
      pipelineColumn,
      today,
      yesterday,
      dateFrom,
      dateTo,
      paymentMethod,
      q,
    } = dto;
    const skip = (page - 1) * limit;

    const targetStoreIds = storeId
      ? (storeIds.includes(storeId) ? [storeId] : (() => { throw new ForbiddenException('Store does not belong to you'); })())
      : storeIds;

    const group = merchantStatusGroup;

    const dayFilter = merchantOrderDayFilter({ today, yesterday });

    const visibilityWhere = buildMerchantListWhere({
      status,
      merchantStatusGroup: group,
      pipelineColumn: pipelineColumn as MerchantPipelineColumn | undefined,
    });

    const where: Prisma.OrderWhereInput = {
      storeId: { in: targetStoreIds },
      ...visibilityWhere,
      ...(paymentMethod && { paymentMethod }),
      ...(dayFilter ?? {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: 'insensitive' } },
              { buyerProfile: { name: { contains: q, mode: 'insensitive' } } },
              { buyerProfile: { user: { phone: { contains: q } } } },
              { items: { some: { OR: [
                { productName: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
              ] } } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
          updatedAt: true,
          storeId: true,
          orderVertical: true,
          deliveryLat: true,
          deliveryLng: true,
          buyerProfile: {
            select: { name: true, user: { select: { phone: true } } },
          },
          items: { select: { productName: true, quantity: true, sku: true }, take: 5 },
          delivery: {
            select: {
              status: true,
              assignedAt: true,
              riderProfile: {
                select: {
                  id: true,
                  name: true,
                  user: { select: { phone: true } },
                },
              },
            },
          },
          statusHistory: {
            select: { status: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    this.logger.log(
      `listMerchantOrders stores=${targetStoreIds.length} status=${status ?? 'all'} → ${total} orders`,
    );

    return {
      orders: orders.map((o) => serializeMerchantListItem(o)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markOrderIssue(userId: string, orderId: string, note?: string, ipAddress?: string) {
    await this.requireMerchantOrderOwnership(userId, orderId);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (TERMINAL.has(order.status)) {
      throw new BadRequestException(`Cannot flag issue on terminal order: ${order.status}`);
    }

    await this.statusHistory.appendEntry({
      orderId,
      status: order.status,
      actorType: OrderActorType.MERCHANT,
      actorId: userId,
      note: note ?? 'Merchant flagged an issue',
      metadata: { issue: true } as Prisma.InputJsonValue,
    });

    void this.cache.invalidateAll(orderId);
    return { orderId, flagged: true };
  }

  // ── Admin: list all orders ────────────────────────────────────────────────

  async listAdminOrders(dto: ListAdminOrdersDto) {
    const {
      page = 1,
      limit = 20,
      status,
      storeId,
      today,
      statusGroup,
      merchantId,
      riderId,
      dateFrom,
      dateTo,
      paymentMethod,
      paymentStatus,
    } = dto;
    const skip = (page - 1) * limit;

    const dayFilter = today ? orderIstDayFilter({ today: true }) : undefined;

    const where: Prisma.OrderWhereInput = {
      ...(storeId && { storeId }),
      ...(merchantId && { store: { merchantProfileId: merchantId } }),
      ...(riderId && { delivery: { riderProfileId: riderId } }),
      ...(paymentMethod && { paymentMethod }),
      ...(paymentStatus && { paymentStatus }),
      ...(dayFilter ?? {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
      ...(status
        ? { status }
        : statusGroup
          ? { status: { in: [...ADMIN_STATUS_GROUPS[statusGroup]] } }
          : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
          updatedAt: true,
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              merchantProfile: { select: { id: true, businessName: true } },
            },
          },
          buyerProfile: { select: { id: true, name: true } },
          delivery: {
            select: {
              status: true,
              riderProfile: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    this.logger.log(
      `listAdminOrders status=${status ?? statusGroup ?? 'all'} today=${Boolean(today)} → ${total} orders`,
    );

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        deliveryStatus: o.delivery?.status ?? null,
        store: o.store
          ? {
              id: o.store.id,
              name: o.store.name,
              slug: o.store.slug,
              merchant: o.store.merchantProfile,
            }
          : null,
        buyer: o.buyerProfile,
        rider: o.delivery?.riderProfile ?? null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: ORDER_DETAIL_SELECT,
    });
    if (!order) throw new NotFoundException('Order not found');
    return serializeDetail(order);
  }

  // ── Merchant: get order detail ─────────────────────────────────────────────

  async getMerchantOrder(userId: string, orderId: string) {
    await this.requireMerchantOrderOwnership(userId, orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: ORDER_DETAIL_SELECT,
    });
    if (!order) throw new NotFoundException('Order not found');

    const customer = await this.getBuyerStoreStats(order.buyerProfile.id, order.store.id);
    const deliveryBatch = await this.prisma.deliveryBatchItem.findUnique({
      where: { orderId },
      include: {
        batch: {
          include: {
            items: { include: { order: { select: { orderNumber: true } } }, orderBy: { sequence: 'asc' } },
          },
        },
      },
    });
    const fulfillmentBatch = deliveryBatch
      ? {
          isBatched: deliveryBatch.batch.totalOrders > 1,
          batchId: deliveryBatch.batchId,
          batchStatus: deliveryBatch.batch.status,
          sequence: deliveryBatch.sequence,
          totalOrders: deliveryBatch.batch.totalOrders,
          label:
            deliveryBatch.batch.totalOrders > 1
              ? `Part of delivery batch (${deliveryBatch.sequence}/${deliveryBatch.batch.totalOrders})`
              : 'Single order delivery',
          orders: deliveryBatch.batch.items.map((i) => i.order.orderNumber),
        }
      : { isBatched: false, label: 'Single order delivery' };
    const view = {
      ...serializeDetail(order),
      customer,
      operations: buildOrderOperations(order),
      fulfillmentBatch,
    };
    void this.cache.setDetail(orderId, view);
    return view;
  }

  // ── Merchant: advance order state ────────────────────────────────────────
  //
  // confirm   → PAID            → MERCHANT_ACCEPTED
  // preparing → MERCHANT_ACCEPTED → PREPARING
  // packing   → PREPARING       → PACKING
  // ready     → PACKING         → READY_FOR_PICKUP (auto-assign rider)

  async advanceMerchantOrder(
    userId: string,
    orderId: string,
    targetStatus: OrderStatus,
    note?: string,
    ipAddress?: string,
  ) {
    await this.requireMerchantOrderOwnership(userId, orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, orderNumber: true, storeId: true, orderVertical: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (TERMINAL.has(order.status)) {
      throw new BadRequestException(`Order is in a terminal state: ${order.status}`);
    }

    const forwardMap = merchantForwardMap(order.orderVertical);
    const expectedNext = forwardMap[order.status];
    if (!expectedNext || expectedNext !== targetStatus) {
      throw new BadRequestException(
        `Invalid transition: ${order.status} → ${targetStatus}. ` +
        `Expected next state: ${expectedNext ?? 'none (terminal)'}`,
      );
    }

    await this.statusHistory.transition({
      orderId: order.id,
      toStatus: targetStatus,
      actorType: OrderActorType.MERCHANT,
      actorId: userId,
      note,
    });

    if (order.orderVertical === OrderVertical.FOOD) {
      const kitchenStatus = this.foodKitchenStatusForOrderStatus(targetStatus);
      if (kitchenStatus) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { kitchenStatus },
        });
      }
    }

    const auditActions: Record<OrderStatus, string> = {
      [OrderStatus.MERCHANT_ACCEPTED]: 'ORDER_CONFIRMED',
      [OrderStatus.PREPARING]: 'ORDER_PREPARING',
      [OrderStatus.PACKING]: 'ORDER_PACKING',
      [OrderStatus.READY_FOR_PICKUP]: 'ORDER_READY',
    } as any;

    const domainEventTypes: Partial<Record<OrderStatus, DomainEventType>> = {
      [OrderStatus.MERCHANT_ACCEPTED]: DomainEventType.ORDER_ACCEPTED,
      [OrderStatus.PREPARING]: DomainEventType.ORDER_PREPARING,
      [OrderStatus.PACKING]: DomainEventType.ORDER_PREPARING,
      [OrderStatus.READY_FOR_PICKUP]: DomainEventType.ORDER_READY_FOR_PICKUP,
    };

    await this.audit.log({
      actorId: userId,
      action: auditActions[targetStatus] ?? 'ORDER_STATUS_CHANGED',
      resourceType: 'order',
      resourceId: orderId,
      ipAddress,
      metadata: { from: order.status, to: targetStatus, orderNumber: order.orderNumber } as Prisma.InputJsonValue,
    });

    const eventType = domainEventTypes[targetStatus];
    if (eventType) {
      void this.domainEvents.emit(
        eventType,
        'order',
        orderId,
        { from: order.status, to: targetStatus, storeId: order.storeId } as Prisma.InputJsonValue,
        { userId, ipAddress: ipAddress ?? null },
      );
    }

    if (targetStatus === OrderStatus.MERCHANT_ACCEPTED) {
      void this.buyerPush.notifyOrderAccepted(orderId).catch(() => {});
    }

    const prepStatuses = new Set<OrderStatus>([
      OrderStatus.MERCHANT_ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.PACKING,
      OrderStatus.READY_FOR_PICKUP,
    ]);
    if (prepStatuses.has(targetStatus)) {
      this.deliveryTracking.emitOrderStatus({
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeId: order.storeId,
        orderStatus: targetStatus,
      });
    }

    void this.cache.invalidateAll(orderId);
    this.logger.log({ userId, orderId, from: order.status, to: targetStatus }, 'Order status advanced');

    if (targetStatus === OrderStatus.READY_FOR_PICKUP) {
      void this.buyerPush.notifyReadyForPickup(orderId).catch(() => {});
      void this.deliveryDispatch.dispatchAfterReadyForPickup(orderId).then((result) => {
        if (result?.mode === 'own_fleet') {
          void this.cache.invalidateAll(orderId);
          this.logger.log(
            { orderId, riderProfileId: result.riderProfileId, deliveryId: result.deliveryId },
            'Auto-assigned rider after READY_FOR_PICKUP',
          );
        } else if (result?.mode === 'provider') {
          void this.cache.invalidateAll(orderId);
          this.logger.log(
            {
              orderId,
              deliveryId: result.deliveryId,
              shipmentId: result.shipmentId,
              trackingNumber: result.trackingNumber,
            },
            'Provider shipment created after READY_FOR_PICKUP',
          );
        } else {
          this.logger.warn({ orderId }, 'Dispatch found no provider/rider — order stays READY_FOR_PICKUP');
        }
      }).catch((err) => {
        this.logger.error({ orderId, err }, 'Dispatch failed after READY_FOR_PICKUP');
      });
    }

    return { orderId, status: targetStatus };
  }

  // ── Merchant: cancel order ────────────────────────────────────────────────

  async cancelByMerchant(userId: string, orderId: string, dto: CancelOrderDto, ipAddress?: string) {
    await this.requireMerchantOrderOwnership(userId, orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentMethod: true, paymentStatus: true, orderNumber: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!MERCHANT_CANCELLABLE.has(order.status)) {
      throw new BadRequestException(
        `Order cannot be cancelled in status: ${order.status}. ` +
        `Merchant cancellation is only allowed before READY_FOR_PICKUP.`,
      );
    }

    const newStatus = OrderStatus.CANCELLED_BY_MERCHANT;
    await this.statusHistory.transition({
      orderId: order.id,
      toStatus: newStatus,
      actorType: OrderActorType.MERCHANT,
      actorId: userId,
      note: dto.reason,
    });
    await this.reservation.releaseOrderReservations(order.id, userId);

    if (order.paymentStatus === PaymentStatus.PAID) {
      await this.orderRefunds.initiateRefund({
        orderId: order.id,
        actorId: userId,
        initiatorType: OrderRefundInitiator.MERCHANT,
        reason: dto.reason,
        ipAddress,
      });
    }

    void this.cache.invalidateAll(orderId);
    this.logger.log({ userId, orderId, orderNumber: order.orderNumber }, 'Order cancelled by merchant');

    return { orderId, status: newStatus };
  }

  // Refunds are handled by OrderRefundService (Razorpay-first, idempotent).

  private async getBuyerStoreStats(buyerProfileId: string, storeId: string) {
    const [agg, buyer] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          buyerProfileId,
          storeId,
          status: { notIn: [OrderStatus.CANCELLED_BY_BUYER, OrderStatus.CANCELLED_BY_MERCHANT, OrderStatus.CANCELLED_BY_ADMIN] },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.buyerProfile.findUnique({
        where: { id: buyerProfileId },
        select: { name: true, user: { select: { phone: true } } },
      }),
    ]);
    return {
      name: buyer?.name ?? null,
      phone: buyer?.user?.phone ?? null,
      orderCount: agg._count.id,
      lifetimeSpend: Number(agg._sum.totalAmount ?? 0),
    };
  }

  // ── Private: resolve ownership ────────────────────────────────────────────

  private async requireBuyerProfile(userId: string) {
    const bp = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!bp) throw new NotFoundException('Buyer profile not found');
    return bp;
  }

  private async getMerchantStoreIds(userId: string): Promise<string[]> {
    const mp = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!mp) return [];

    const stores = await this.prisma.store.findMany({
      where: { merchantProfileId: mp.id, deletedAt: null },
      select: { id: true },
    });
    return stores.map((s) => s.id);
  }

  private async requireMerchantOrderOwnership(userId: string, orderId: string): Promise<void> {
    const storeIds = await this.getMerchantStoreIds(userId);
    if (storeIds.length === 0) throw new ForbiddenException('No merchant stores found');

    const exists = await this.prisma.order.findFirst({
      where: { id: orderId, storeId: { in: storeIds } },
      select: { id: true },
    });
    if (!exists) throw new ForbiddenException('Order does not belong to your store');
  }

  private foodKitchenStatusForOrderStatus(status: OrderStatus): FoodKitchenStatus | null {
    switch (status) {
      case OrderStatus.MERCHANT_ACCEPTED:
        return FoodKitchenStatus.NEW;
      case OrderStatus.PREPARING:
        return FoodKitchenStatus.PREPARING;
      case OrderStatus.READY_FOR_PICKUP:
        return FoodKitchenStatus.READY;
      case OrderStatus.DELIVERED:
      case OrderStatus.COMPLETED:
        return FoodKitchenStatus.COMPLETED;
      default:
        return null;
    }
  }
}

// ── Serializers ──────────────────────────────────────────────────────────────

function serializeListItem(order: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt,
    store: order.store,
    storeId: order.storeId,
    buyerProfile: order.buyerProfile,
    items: order.items,
  };
}

function serializeMerchantListItem(order: any) {
  const acceptedAt = order.statusHistory?.find(
    (h: { status: string }) => h.status === 'MERCHANT_ACCEPTED' || h.status === 'PREPARING',
  )?.createdAt;
  const readyAt = order.statusHistory?.find(
    (h: { status: string }) => h.status === 'READY_FOR_PICKUP',
  )?.createdAt;
  const pipelineColumn = resolvePipelineColumn(order.status, order.paymentMethod);
  const awaitingRider =
    order.status === 'READY_FOR_PICKUP' && !order.delivery?.riderProfile;
  const riderWaitMins = awaitingRider && readyAt ? minutesSince(readyAt) : 0;

  return {
    ...serializeListItem(order),
    updatedAt: order.updatedAt,
    pipelineColumn,
    buyerProfile: order.buyerProfile
      ? {
          name: order.buyerProfile.name,
          phone: order.buyerProfile.user?.phone ?? null,
        }
      : null,
    rider: order.delivery?.riderProfile
      ? {
          id: order.delivery.riderProfile.id,
          name: order.delivery.riderProfile.name,
          phone: order.delivery.riderProfile.user?.phone ?? null,
        }
      : null,
    deliveryStatus: order.delivery?.status ?? null,
    awaitingRider,
    riderWaitMins,
    operations: {
      orderAgeMins: minutesSince(order.createdAt),
      sinceAcceptedMins: acceptedAt ? minutesSince(acceptedAt) : null,
      prepSla: acceptedAt
        ? slaLevel(minutesSince(acceptedAt), SLA_THRESHOLDS.prepare.yellow, SLA_THRESHOLDS.prepare.red)
        : 'green',
      riderWaitSla: awaitingRider
        ? slaLevel(riderWaitMins, SLA_THRESHOLDS.riderWait.yellow, SLA_THRESHOLDS.riderWait.red)
        : 'green',
    },
  };
}

function buildOrderOperations(order: any) {
  const acceptedAt = order.statusHistory?.find(
    (h: { status: string }) =>
      h.status === 'MERCHANT_ACCEPTED' || h.status === 'PREPARING' || h.status === 'PACKING',
  )?.createdAt;
  const packingAt = order.statusHistory?.find((h: { status: string }) => h.status === 'PACKING')?.createdAt;
  const readyAt = order.statusHistory?.find((h: { status: string }) => h.status === 'READY_FOR_PICKUP')?.createdAt;
  const awaitingRider = order.status === 'READY_FOR_PICKUP' && !order.delivery?.riderProfile;
  const riderWaitMins = awaitingRider && readyAt ? minutesSince(readyAt) : 0;

  return {
    pipelineColumn: resolvePipelineColumn(order.status, order.paymentMethod),
    orderAgeMins: minutesSince(order.createdAt),
    sinceAcceptedMins: acceptedAt ? minutesSince(acceptedAt) : null,
    sincePackingMins: packingAt ? minutesSince(packingAt) : null,
    awaitingRider,
    riderWaitMins,
    prepSla: acceptedAt
      ? slaLevel(minutesSince(acceptedAt), SLA_THRESHOLDS.prepare.yellow, SLA_THRESHOLDS.prepare.red)
      : 'green',
    packSla: packingAt
      ? slaLevel(minutesSince(packingAt), SLA_THRESHOLDS.pack.yellow, SLA_THRESHOLDS.pack.red)
      : 'green',
    riderWaitSla: awaitingRider
      ? slaLevel(riderWaitMins, SLA_THRESHOLDS.riderWait.yellow, SLA_THRESHOLDS.riderWait.red)
      : 'green',
  };
}

function serializeDetail(order: any) {
  const items = order.items.map((i: any) => ({
    id: i.id,
    productName: i.productName,
    variantName: i.variantName,
    sku: i.sku,
    quantity: i.quantity,
    unitPrice: Number(i.unitPrice),
    discount: Number(i.discount),
    totalPrice: Number(i.totalPrice),
  }));
  const statusHistory = order.statusHistory.map((h: any) => ({
    status: h.status,
    note: h.note,
    changedBy: h.changedBy,
    actorType: h.actorType,
    metadata: h.metadata,
    createdAt: h.createdAt,
  }));

  const delivery = order.delivery ? serializeDelivery(order.delivery, order) : null;
  const timeline = buildEnrichedTimeline(statusHistory, order.delivery, order.status);

  const store = order.store
    ? {
        id: order.store.id,
        name: order.store.name,
        slug: order.store.slug,
        phone: order.store.phone,
        merchant: order.store.merchantProfile
          ? {
              id: order.store.merchantProfile.id,
              businessName: order.store.merchantProfile.businessName,
            }
          : null,
      }
    : null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    deliveryFee: Number(order.deliveryFee),
    taxAmount: Number(order.taxAmount),
    totalAmount: Number(order.totalAmount),
    deliveryAddress: order.deliveryAddress,
    buyerNote: order.buyerNote,
    cancelReason: order.cancelReason,
    paidAt: order.paidAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    store,
    buyerProfile: order.buyerProfile
      ? {
          id: order.buyerProfile.id,
          name: order.buyerProfile.name,
          phone: order.buyerProfile.user?.phone ?? null,
        }
      : null,
    items,
    statusHistory,
    timeline,
    delivery,
    payment: order.payment,
    canReview:
      order.status === OrderStatus.DELIVERED || order.status === OrderStatus.COMPLETED,
    review: order.review
      ? {
          id: order.review.id,
          rating: order.review.rating,
          storeExperience: order.review.storeExperience,
          deliveryExperience: order.review.deliveryExperience,
          productQuality: order.review.productQuality,
          title: order.review.title,
          review: order.review.comment,
          images: order.review.images ?? [],
          verifiedPurchase: order.review.verifiedPurchase,
          merchantReply: order.review.merchantReply,
          merchantRepliedAt: order.review.merchantRepliedAt,
          createdAt: order.review.createdAt,
          updatedAt: order.review.updatedAt,
        }
      : null,
  };
}

function serializeDelivery(delivery: any, order: any) {
  const storeLat = order.store?.latitude ?? delivery.pickupLat ?? null;
  const storeLng = order.store?.longitude ?? delivery.pickupLng ?? null;
  const customerLat = order.deliveryLat ?? delivery.deliveryLat ?? null;
  const customerLng = order.deliveryLng ?? delivery.deliveryLng ?? null;

  const hasActiveAssignment = Boolean(
    delivery.riderProfileId &&
      delivery.riderProfile &&
      (delivery.assignedAt ||
        (delivery.assignments ?? []).some((a: { status: string }) => a.status === 'ACCEPTED')),
  );

  const eta = computeDeliveryEta({
    orderStatus: order.status,
    deliveryStatus: delivery.status,
    storeLat,
    storeLng,
    customerLat,
    customerLng,
    riderLat: delivery.riderProfile?.currentLat,
    riderLng: delivery.riderProfile?.currentLng,
    pickedUpAt: delivery.pickedUpAt,
    hasActiveAssignment,
  });

  const distanceKm = safeDistanceKm(storeLat, storeLng, customerLat, customerLng);

  return {
    id: delivery.id,
    status: delivery.status,
    distanceKm,
    estimatedMins: eta.estimatedMins,
    estimatedArrivalAt: delivery.estimatedArrivalAt ?? null,
    etaAvailable: eta.etaAvailable,
    liveTrackingAvailable: eta.liveTrackingAvailable,
    waitingForPickup:
      hasActiveAssignment &&
      !delivery.pickedUpAt &&
      !['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(order.status),
    assignedAt: delivery.assignedAt,
    arrivedAtStoreAt: delivery.arrivedAtStoreAt,
    pickedUpAt: delivery.pickedUpAt,
    arrivedAtCustomerAt: delivery.arrivedAtCustomerAt,
    deliveredAt: delivery.deliveredAt,
    rider: delivery.riderProfile
      ? {
          id: delivery.riderProfile.id,
          name: delivery.riderProfile.name,
          phone: delivery.riderProfile.user?.phone ?? null,
          vehicleType: delivery.riderProfile.vehicleType ?? null,
          status: delivery.riderProfile.status,
          currentLat: delivery.riderProfile.currentLat,
          currentLng: delivery.riderProfile.currentLng,
          lastLocationAt: delivery.riderProfile.lastLocationAt,
        }
      : null,
    assignmentTimeline: (delivery.assignments ?? []).map((a: any) => ({
      id: a.id,
      status: a.status,
      offeredAt: a.offeredAt,
      respondedAt: a.respondedAt,
      expiresAt: a.expiresAt,
      riderName: a.riderProfile?.name ?? null,
    })),
  };
}

function buildEnrichedTimeline(
  statusHistory: Array<{
    status: string;
    note: string | null;
    changedBy: string | null;
    actorType?: string;
    metadata?: unknown;
    createdAt: Date;
  }>,
  delivery: any,
  orderStatus?: string,
) {
  const pickedUp =
    delivery?.pickedUpAt != null ||
    orderStatus === 'PICKED_UP' ||
    orderStatus === 'OUT_FOR_DELIVERY' ||
    orderStatus === 'DELIVERED' ||
    orderStatus === 'COMPLETED';

  const entries = statusHistory
    .filter((h) => {
      const status = (h.metadata as { milestone?: string } | null)?.milestone ?? h.status;
      if (status === 'OUT_FOR_DELIVERY' && !pickedUp) return false;
      return true;
    })
    .map((h) => {
      const milestone = (h.metadata as { milestone?: string } | null)?.milestone;
      return {
        ...h,
        status: milestone ?? h.status,
      };
    });
  const hasStatus = (s: string) => entries.some((e) => e.status === s);

  const deliveryMilestones: Array<{ status: string; note: string; at: Date | null }> = [
    { status: 'ARRIVED_AT_STORE', note: 'Rider arrived at store', at: delivery?.arrivedAtStoreAt ?? null },
    { status: 'PICKED_UP', note: 'Order picked up by rider', at: delivery?.pickedUpAt ?? null },
    { status: 'ARRIVED_AT_CUSTOMER', note: 'Rider arrived at customer', at: delivery?.arrivedAtCustomerAt ?? null },
    { status: 'DELIVERED', note: 'Order delivered', at: delivery?.deliveredAt ?? null },
  ];

  for (const m of deliveryMilestones) {
    if (!m.at) continue;
    if (m.status === 'DELIVERED' && hasStatus('DELIVERED')) continue;
    if (m.status === 'PICKED_UP' && (hasStatus('PICKED_UP') || hasStatus('OUT_FOR_DELIVERY'))) continue;
    if (hasStatus(m.status)) continue;
    entries.push({
      status: m.status,
      note: m.note,
      changedBy: null,
      actorType: 'RIDER',
      metadata: null,
      createdAt: m.at,
    });
  }

  return entries.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
