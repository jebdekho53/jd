import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DomainEventType,
  OrderActorType,
  OrderRefundInitiator,
  OrderRefundStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payment/razorpay.service';
import { LedgerService } from '../finance/ledger.service';
import { RewardService } from '../wallet-loyalty/reward.service';
import { CreditNoteService } from '../compliance/credit-note.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { FinanceAlertService } from '../finance/finance-alert.service';
import { roundMoney } from '../settlement/settlement.utils';

export interface InitiateOrderRefundInput {
  orderId: string;
  actorId: string;
  initiatorType: OrderRefundInitiator;
  reason?: string;
  ipAddress?: string;
  /** Partial refund amount in INR; defaults to full refundable total. */
  amount?: number;
  idempotencyKey?: string;
}

@Injectable()
export class OrderRefundService {
  private readonly logger = new Logger(OrderRefundService.name);
  private readonly maxRetries = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly ledger: LedgerService,
    private readonly rewards: RewardService,
    private readonly creditNotes: CreditNoteService,
    private readonly emailNotifications: EmailNotificationService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly financeAlerts: FinanceAlertService,
  ) {}

  /** Cancellation / admin refund — never marks REFUNDED before Razorpay confirms. */
  async initiateRefund(input: InitiateOrderRefundInput): Promise<{ refundId: string; status: OrderRefundStatus }> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { payment: true, buyerProfile: { include: { wallet: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      const existing = await this.prisma.orderRefund.findFirst({
        where: { orderId: input.orderId, status: OrderRefundStatus.REFUNDED },
      });
      if (existing) return { refundId: existing.id, status: existing.status };
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Order is not in a refundable payment state');
    }

    const idempotencyKey =
      input.idempotencyKey ?? `order-cancel-refund:${input.orderId}`;

    const existing = await this.prisma.orderRefund.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      if (existing.status === OrderRefundStatus.REFUNDED) {
        return { refundId: existing.id, status: existing.status };
      }
      if (existing.status === OrderRefundStatus.PENDING || existing.status === OrderRefundStatus.FAILED) {
        await this.processRefundRecord(existing.id, input.actorId, input.ipAddress);
        const updated = await this.prisma.orderRefund.findUniqueOrThrow({ where: { id: existing.id } });
        return { refundId: updated.id, status: updated.status };
      }
      return { refundId: existing.id, status: existing.status };
    }

    const { walletAmount, razorpayAmount, totalAmount } = this.computeRefundSplit(order, input.amount);

    if (totalAmount <= 0) {
      throw new BadRequestException('Nothing to refund for this order');
    }

    const refund = await this.prisma.orderRefund.create({
      data: {
        orderId: input.orderId,
        amount: totalAmount,
        walletAmount,
        razorpayAmount,
        status: OrderRefundStatus.PENDING,
        reason: input.reason,
        initiatedBy: input.actorId,
        initiatorType: input.initiatorType,
        idempotencyKey,
      },
    });

    await this.processRefundRecord(refund.id, input.actorId, input.ipAddress);
    const updated = await this.prisma.orderRefund.findUniqueOrThrow({ where: { id: refund.id } });
    return { refundId: updated.id, status: updated.status };
  }

  async retryFailedRefunds(): Promise<number> {
    const failed = await this.prisma.orderRefund.findMany({
      where: {
        status: OrderRefundStatus.FAILED,
        retryCount: { lt: this.maxRetries },
      },
      take: 25,
      orderBy: { updatedAt: 'asc' },
    });

    let retried = 0;
    for (const row of failed) {
      await this.prisma.orderRefund.update({
        where: { id: row.id },
        data: { status: OrderRefundStatus.PENDING, retryCount: { increment: 1 } },
      });
      await this.processRefundRecord(row.id, row.initiatedBy ?? 'system');
      retried++;
    }
    return retried;
  }

  async listFailedRefunds(page = 1, limit = 25) {
    const where = { status: OrderRefundStatus.FAILED };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.orderRefund.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: { select: { orderNumber: true, totalAmount: true, paymentMethod: true } },
        },
      }),
      this.prisma.orderRefund.count({ where }),
    ]);
    return {
      refunds: rows.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        orderNumber: r.order.orderNumber,
        amount: Number(r.amount),
        razorpayAmount: Number(r.razorpayAmount),
        walletAmount: Number(r.walletAmount),
        status: r.status,
        retryCount: r.retryCount,
        lastError: r.lastError,
        razorpayRefundId: r.razorpayRefundId,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  /** Razorpay refund.processed webhook reconciliation */
  async reconcileRazorpayRefund(payload: Record<string, unknown> | undefined): Promise<void> {
    const refundEntity = this.extractRefundEntity(payload);
    if (!refundEntity?.id) return;

    const razorpayRefundId = refundEntity.id as string;
    const paymentId = refundEntity.payment_id as string | undefined;

    const refund = await this.prisma.orderRefund.findFirst({
      where: { razorpayRefundId },
    });
    if (refund && refund.status !== OrderRefundStatus.REFUNDED) {
      await this.finalizeRefund(refund.id, refund.initiatedBy ?? 'webhook');
      return;
    }

    if (!paymentId) return;

    const payment = await this.prisma.payment.findFirst({
      where: { razorpayPaymentId: paymentId },
      select: { orderId: true },
    });
    if (!payment?.orderId) return;

    const pending = await this.prisma.orderRefund.findFirst({
      where: {
        orderId: payment.orderId,
        status: { in: [OrderRefundStatus.PENDING, OrderRefundStatus.PROCESSING] },
      },
    });
    if (pending) {
      await this.prisma.orderRefund.update({
        where: { id: pending.id },
        data: { razorpayRefundId },
      });
      await this.finalizeRefund(pending.id, 'webhook');
    }
  }

  private async processRefundRecord(
    refundId: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    const refund = await this.prisma.orderRefund.findUnique({
      where: { id: refundId },
      include: {
        order: { include: { payment: true, buyerProfile: { include: { wallet: true } } } },
      },
    });
    if (!refund || refund.status === OrderRefundStatus.REFUNDED) return;

    await this.prisma.orderRefund.update({
      where: { id: refundId },
      data: { status: OrderRefundStatus.PROCESSING },
    });

    try {
      let razorpayRefundId = refund.razorpayRefundId;
      const razorpayAmount = Number(refund.razorpayAmount);

      if (razorpayAmount > 0 && !razorpayRefundId) {
        const paymentId = refund.order.payment?.razorpayPaymentId;
        if (!paymentId || !this.razorpay.isConfigured()) {
          throw new BadRequestException('Razorpay payment not available for refund');
        }
        const result = await this.razorpay.createRefund(
          paymentId,
          razorpayAmount,
          { orderId: refund.orderId, refundId },
        );
        razorpayRefundId = result.id;

        await this.prisma.orderRefund.update({
          where: { id: refundId },
          data: { razorpayRefundId },
        });

        if (refund.order.payment) {
          const existingTxn = await this.prisma.paymentTransaction.findFirst({
            where: { razorpayRefundId: result.id },
          });
          if (!existingTxn) {
            await this.prisma.paymentTransaction.create({
              data: {
                paymentId: refund.order.payment.id,
                type: 'REFUND',
                amount: razorpayAmount,
                status: PaymentStatus.REFUNDED,
                razorpayRefundId: result.id,
                metadata: { orderRefundId: refundId } as Prisma.InputJsonValue,
              },
            });
          }
        }
      }

      await this.finalizeRefund(refundId, actorId, ipAddress);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refund failed';
      this.logger.error({ err, refundId, orderId: refund.orderId }, 'Order refund failed');
      await this.prisma.orderRefund.update({
        where: { id: refundId },
        data: { status: OrderRefundStatus.FAILED, lastError: message.slice(0, 2000) },
      });
      void this.financeAlerts.raiseRefundFailed(refund.orderId, refundId, message).catch(() => {});
    }
  }

  private async finalizeRefund(
    refundId: string,
    actorId: string,
    ipAddress?: string,
  ): Promise<void> {
    const refund = await this.prisma.orderRefund.findUniqueOrThrow({
      where: { id: refundId },
      include: { order: true },
    });
    if (refund.status === OrderRefundStatus.REFUNDED) return;

    const orderId = refund.orderId;
    const walletAmount = Number(refund.walletAmount);

    if (walletAmount > 0) {
      await this.rewards.refundWalletForOrder(orderId, actorId);
    }

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED, paymentStatus: PaymentStatus.REFUNDED },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.REFUNDED,
          note: refund.reason ?? 'Refund processed',
          changedBy: actorId,
          actorType: OrderActorType.SYSTEM,
        },
      }),
      this.prisma.orderRefund.update({
        where: { id: refundId },
        data: { status: OrderRefundStatus.REFUNDED, processedAt: new Date() },
      }),
    ]);

    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUNDED },
      });
    }

    const totalRefunded = Number(refund.amount);
    void this.ledger.recordRefund(orderId, totalRefunded).catch((err) => {
      this.logger.error({ err, orderId }, 'Ledger refund failed');
    });
    void this.creditNotes.createForRefund(orderId, refund.reason ?? 'Order refund').catch((err) => {
      this.logger.error({ err, orderId }, 'Credit note failed');
    });
    void this.emailNotifications.sendRefundProcessed(orderId).catch((err) => {
      this.logger.error({ err, orderId }, 'Refund email failed');
    });

    await Promise.all([
      this.audit.log({
        actorId,
        action: 'ORDER_REFUNDED',
        resourceType: 'order',
        resourceId: orderId,
        ipAddress,
        metadata: {
          refundId,
          razorpayRefundId: refund.razorpayRefundId,
          amount: totalRefunded,
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.ORDER_REFUNDED,
        'order',
        orderId,
        { refundId, razorpayRefundId: refund.razorpayRefundId ?? null } as Prisma.InputJsonValue,
        { userId: actorId, ipAddress: ipAddress ?? null },
      ),
    ]);
  }

  private computeRefundSplit(
    order: {
      totalAmount: Prisma.Decimal;
      razorpayAmount: Prisma.Decimal | null;
      walletAmountUsed: Prisma.Decimal;
      paymentMethod: PaymentMethod;
    },
    requestedAmount?: number,
  ): { walletAmount: number; razorpayAmount: number; totalAmount: number } {
    const orderRzp = Number(order.razorpayAmount ?? 0);
    const orderWallet = Number(order.walletAmountUsed ?? 0);

    let razorpayAmount = 0;
    let walletAmount = 0;

    if (order.paymentMethod === PaymentMethod.RAZORPAY || order.paymentMethod === PaymentMethod.WALLET_RAZORPAY) {
      razorpayAmount = orderRzp;
      walletAmount = orderWallet;
    } else if (order.paymentMethod === PaymentMethod.WALLET) {
      walletAmount = orderWallet || Number(order.totalAmount);
    } else if (order.paymentMethod === PaymentMethod.WALLET_COD) {
      walletAmount = orderWallet;
    } else {
      walletAmount = orderWallet;
      razorpayAmount = orderRzp;
    }

    let totalAmount = roundMoney(razorpayAmount + walletAmount);
    if (requestedAmount != null && requestedAmount > 0) {
      totalAmount = roundMoney(Math.min(requestedAmount, totalAmount));
      if (totalAmount < razorpayAmount + walletAmount) {
        razorpayAmount = roundMoney(Math.min(razorpayAmount, totalAmount));
        walletAmount = roundMoney(totalAmount - razorpayAmount);
      }
    }

    return { walletAmount, razorpayAmount, totalAmount };
  }

  private extractRefundEntity(payload: Record<string, unknown> | undefined): Record<string, unknown> | null {
    if (!payload) return null;
    const refund = payload.refund;
    if (refund && typeof refund === 'object' && !Array.isArray(refund)) {
      const entity = (refund as { entity?: unknown }).entity;
      if (entity && typeof entity === 'object') return entity as Record<string, unknown>;
      return refund as Record<string, unknown>;
    }
    return null;
  }
}
