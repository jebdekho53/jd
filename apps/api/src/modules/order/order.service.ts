import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DomainEventType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderCacheService } from './order-cache.service';
import { ListOrdersDto, ListMerchantOrdersDto } from './dto/list-orders.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

// ── State machine ────────────────────────────────────────────────────────────
//
// These are the valid one-step forward transitions for the merchant-driven flow.
// COD orders start at MERCHANT_ACCEPTED (already "confirmed" at creation).

const MERCHANT_FORWARD: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PAID]: OrderStatus.MERCHANT_ACCEPTED,
  [OrderStatus.MERCHANT_ACCEPTED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.READY_FOR_PICKUP,
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
  buyerNote: true,
  cancelReason: true,
  paidAt: true,
  completedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  store: { select: { id: true, name: true, slug: true, phone: true } },
  buyerProfile: { select: { id: true, name: true } },
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
    select: { status: true, note: true, changedBy: true, createdAt: true },
    orderBy: { createdAt: 'asc' as const },
  },
  payment: { select: { razorpayOrderId: true, razorpayPaymentId: true, status: true, method: true } },
} satisfies Prisma.OrderSelect;

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly cache: OrderCacheService,
  ) {}

  // ── Buyer: list orders ────────────────────────────────────────────────────

  async listBuyerOrders(userId: string, dto: ListOrdersDto) {
    const bp = await this.requireBuyerProfile(userId);
    const { page = 1, limit = 20, status } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      buyerProfileId: bp.id,
      ...(status && { status }),
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
          totalAmount: true,
          createdAt: true,
          store: { select: { name: true, slug: true } },
          items: { select: { productName: true, quantity: true }, take: 3 },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

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

  async getBuyerOrder(userId: string, orderId: string) {
    const bp = await this.requireBuyerProfile(userId);

    const cached = await this.cache.getDetail(orderId);
    if (cached) return cached;

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerProfileId: bp.id },
      select: ORDER_DETAIL_SELECT,
    });
    if (!order) throw new NotFoundException('Order not found');

    const view = serializeDetail(order);
    void this.cache.setDetail(orderId, view);
    return view;
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
    await this.applyStatusTransition(order.id, order.status, newStatus, userId, dto.reason);

    // Trigger refund if the order was already paid via Razorpay
    if (order.paymentStatus === PaymentStatus.PAID && order.paymentMethod === PaymentMethod.RAZORPAY) {
      await this.initiateRefund(order.id, userId, ipAddress);
    }

    void this.cache.invalidate(orderId);

    this.logger.log({ userId, orderId, orderNumber: order.orderNumber }, 'Order cancelled by buyer');
    return { orderId, status: newStatus };
  }

  // ── Merchant: list orders ─────────────────────────────────────────────────

  async listMerchantOrders(userId: string, dto: ListMerchantOrdersDto) {
    const storeIds = await this.getMerchantStoreIds(userId);
    if (storeIds.length === 0) return { orders: [], meta: { page: dto.page ?? 1, limit: dto.limit ?? 20, total: 0, totalPages: 0 } };

    const { page = 1, limit = 20, status, storeId } = dto;
    const skip = (page - 1) * limit;

    // If a specific storeId is requested, verify it belongs to this merchant
    const targetStoreIds = storeId
      ? (storeIds.includes(storeId) ? [storeId] : (() => { throw new ForbiddenException('Store does not belong to you'); })())
      : storeIds;

    const where: Prisma.OrderWhereInput = {
      storeId: { in: targetStoreIds },
      ...(status && { status }),
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
          totalAmount: true,
          createdAt: true,
          storeId: true,
          buyerProfile: { select: { name: true } },
          items: { select: { productName: true, quantity: true }, take: 3 },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

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

  // ── Merchant: get order detail ─────────────────────────────────────────────

  async getMerchantOrder(userId: string, orderId: string) {
    await this.requireMerchantOrderOwnership(userId, orderId);

    const cached = await this.cache.getDetail(orderId);
    if (cached) return cached;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: ORDER_DETAIL_SELECT,
    });
    if (!order) throw new NotFoundException('Order not found');

    const view = serializeDetail(order);
    void this.cache.setDetail(orderId, view);
    return view;
  }

  // ── Merchant: advance order state ────────────────────────────────────────
  //
  // confirm   → PAID            → MERCHANT_ACCEPTED
  // preparing → MERCHANT_ACCEPTED → PREPARING
  // ready     → PREPARING      → READY_FOR_PICKUP

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
      select: { id: true, status: true, orderNumber: true, storeId: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (TERMINAL.has(order.status)) {
      throw new BadRequestException(`Order is in a terminal state: ${order.status}`);
    }

    const expectedNext = MERCHANT_FORWARD[order.status];
    if (!expectedNext || expectedNext !== targetStatus) {
      throw new BadRequestException(
        `Invalid transition: ${order.status} → ${targetStatus}. ` +
        `Expected next state: ${expectedNext ?? 'none (terminal)'}`,
      );
    }

    await this.applyStatusTransition(order.id, order.status, targetStatus, userId, note);

    const auditActions: Record<OrderStatus, string> = {
      [OrderStatus.MERCHANT_ACCEPTED]: 'ORDER_CONFIRMED',
      [OrderStatus.PREPARING]: 'ORDER_PREPARING',
      [OrderStatus.READY_FOR_PICKUP]: 'ORDER_READY',
    } as any;

    const domainEventTypes: Partial<Record<OrderStatus, DomainEventType>> = {
      [OrderStatus.MERCHANT_ACCEPTED]: DomainEventType.ORDER_ACCEPTED,
      [OrderStatus.PREPARING]: DomainEventType.ORDER_PREPARING,
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

    void this.cache.invalidate(orderId);
    this.logger.log({ userId, orderId, from: order.status, to: targetStatus }, 'Order status advanced');

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
    await this.applyStatusTransition(order.id, order.status, newStatus, userId, dto.reason);

    // Trigger refund if paid via Razorpay
    if (order.paymentStatus === PaymentStatus.PAID && order.paymentMethod === PaymentMethod.RAZORPAY) {
      await this.initiateRefund(order.id, userId, ipAddress);
    }

    void this.cache.invalidate(orderId);
    this.logger.log({ userId, orderId, orderNumber: order.orderNumber }, 'Order cancelled by merchant');

    return { orderId, status: newStatus };
  }

  // ── Private: apply status transition ─────────────────────────────────────

  private async applyStatusTransition(
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    actorId: string,
    note?: string,
  ): Promise<void> {
    const cancellationStatuses = new Set<string>([
      OrderStatus.CANCELLED_BY_BUYER,
      OrderStatus.CANCELLED_BY_MERCHANT,
      OrderStatus.CANCELLED_BY_ADMIN,
    ]);
    const isCancellation = cancellationStatuses.has(toStatus);

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: toStatus,
          ...(isCancellation && { cancelledAt: new Date(), cancelReason: note }),
          ...(toStatus === OrderStatus.DELIVERED && { completedAt: new Date() }),
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: toStatus,
          note: note ?? `Transitioned from ${fromStatus}`,
          changedBy: actorId,
        },
      }),
    ]);
  }

  // ── Private: initiate refund ──────────────────────────────────────────────
  //
  // For Phase 7, marks the order REFUNDED and emits the event.
  // Full Razorpay refund API call can be wired in Phase 8.

  private async initiateRefund(orderId: string, actorId: string, ipAddress?: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      select: { id: true, razorpayPaymentId: true },
    });

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED, paymentStatus: PaymentStatus.REFUNDED },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.REFUNDED,
          note: 'Refund initiated on order cancellation',
          changedBy: actorId,
        },
      }),
      ...(payment
        ? [this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.REFUNDED },
          })]
        : []),
    ]);

    await Promise.all([
      this.audit.log({
        actorId,
        action: 'ORDER_REFUNDED',
        resourceType: 'order',
        resourceId: orderId,
        ipAddress,
        metadata: { razorpayPaymentId: payment?.razorpayPaymentId } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.ORDER_REFUNDED,
        'order',
        orderId,
        { razorpayPaymentId: payment?.razorpayPaymentId ?? null } as Prisma.InputJsonValue,
        { userId: actorId, ipAddress: ipAddress ?? null },
      ),
    ]);
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
}

// ── Serializers ──────────────────────────────────────────────────────────────

function serializeListItem(order: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt,
    store: order.store,
    buyerProfile: order.buyerProfile,
    previewItems: order.items,
  };
}

function serializeDetail(order: any) {
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
    store: order.store,
    buyerProfile: order.buyerProfile,
    items: order.items.map((i: any) => ({
      id: i.id,
      productName: i.productName,
      variantName: i.variantName,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      discount: Number(i.discount),
      totalPrice: Number(i.totalPrice),
    })),
    timeline: order.statusHistory,
    payment: order.payment,
  };
}
