"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OrderRefundService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRefundService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const razorpay_service_1 = require("../payment/razorpay.service");
const ledger_service_1 = require("../finance/ledger.service");
const reward_service_1 = require("../wallet-loyalty/reward.service");
const credit_note_service_1 = require("../compliance/credit-note.service");
const email_notification_service_1 = require("../email/email-notification.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const finance_alert_service_1 = require("../finance/finance-alert.service");
const settlement_utils_1 = require("../settlement/settlement.utils");
let OrderRefundService = OrderRefundService_1 = class OrderRefundService {
    constructor(prisma, razorpay, ledger, rewards, creditNotes, emailNotifications, audit, domainEvents, financeAlerts) {
        this.prisma = prisma;
        this.razorpay = razorpay;
        this.ledger = ledger;
        this.rewards = rewards;
        this.creditNotes = creditNotes;
        this.emailNotifications = emailNotifications;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.financeAlerts = financeAlerts;
        this.logger = new common_1.Logger(OrderRefundService_1.name);
        this.maxRetries = 5;
    }
    async initiateRefund(input) {
        const order = await this.prisma.order.findUnique({
            where: { id: input.orderId },
            include: { payment: true, buyerProfile: { include: { wallet: true } } },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.paymentStatus === client_1.PaymentStatus.REFUNDED) {
            const existing = await this.prisma.orderRefund.findFirst({
                where: { orderId: input.orderId, status: client_1.OrderRefundStatus.REFUNDED },
            });
            if (existing)
                return { refundId: existing.id, status: existing.status };
        }
        if (order.paymentStatus !== client_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Order is not in a refundable payment state');
        }
        const idempotencyKey = input.idempotencyKey ?? `order-cancel-refund:${input.orderId}`;
        const existing = await this.prisma.orderRefund.findUnique({
            where: { idempotencyKey },
        });
        if (existing) {
            if (existing.status === client_1.OrderRefundStatus.REFUNDED) {
                return { refundId: existing.id, status: existing.status };
            }
            if (existing.status === client_1.OrderRefundStatus.PENDING || existing.status === client_1.OrderRefundStatus.FAILED) {
                await this.processRefundRecord(existing.id, input.actorId, input.ipAddress);
                const updated = await this.prisma.orderRefund.findUniqueOrThrow({ where: { id: existing.id } });
                return { refundId: updated.id, status: updated.status };
            }
            return { refundId: existing.id, status: existing.status };
        }
        const { walletAmount, razorpayAmount, totalAmount } = this.computeRefundSplit(order, input.amount);
        if (totalAmount <= 0) {
            throw new common_1.BadRequestException('Nothing to refund for this order');
        }
        const refund = await this.prisma.orderRefund.create({
            data: {
                orderId: input.orderId,
                amount: totalAmount,
                walletAmount,
                razorpayAmount,
                status: client_1.OrderRefundStatus.PENDING,
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
    async retryFailedRefunds() {
        const failed = await this.prisma.orderRefund.findMany({
            where: {
                status: client_1.OrderRefundStatus.FAILED,
                retryCount: { lt: this.maxRetries },
            },
            take: 25,
            orderBy: { updatedAt: 'asc' },
        });
        let retried = 0;
        for (const row of failed) {
            await this.prisma.orderRefund.update({
                where: { id: row.id },
                data: { status: client_1.OrderRefundStatus.PENDING, retryCount: { increment: 1 } },
            });
            await this.processRefundRecord(row.id, row.initiatedBy ?? 'system');
            retried++;
        }
        return retried;
    }
    async listFailedRefunds(page = 1, limit = 25) {
        const where = { status: client_1.OrderRefundStatus.FAILED };
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
    async reconcileRazorpayRefund(payload) {
        const refundEntity = this.extractRefundEntity(payload);
        if (!refundEntity?.id)
            return;
        const razorpayRefundId = refundEntity.id;
        const paymentId = refundEntity.payment_id;
        const refund = await this.prisma.orderRefund.findFirst({
            where: { razorpayRefundId },
        });
        if (refund && refund.status !== client_1.OrderRefundStatus.REFUNDED) {
            await this.finalizeRefund(refund.id, refund.initiatedBy ?? 'webhook');
            return;
        }
        if (!paymentId)
            return;
        const payment = await this.prisma.payment.findFirst({
            where: { razorpayPaymentId: paymentId },
            select: { orderId: true },
        });
        if (!payment?.orderId)
            return;
        const pending = await this.prisma.orderRefund.findFirst({
            where: {
                orderId: payment.orderId,
                status: { in: [client_1.OrderRefundStatus.PENDING, client_1.OrderRefundStatus.PROCESSING] },
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
    async processRefundRecord(refundId, actorId, ipAddress) {
        const refund = await this.prisma.orderRefund.findUnique({
            where: { id: refundId },
            include: {
                order: { include: { payment: true, buyerProfile: { include: { wallet: true } } } },
            },
        });
        if (!refund || refund.status === client_1.OrderRefundStatus.REFUNDED)
            return;
        await this.prisma.orderRefund.update({
            where: { id: refundId },
            data: { status: client_1.OrderRefundStatus.PROCESSING },
        });
        try {
            let razorpayRefundId = refund.razorpayRefundId;
            const razorpayAmount = Number(refund.razorpayAmount);
            if (razorpayAmount > 0 && !razorpayRefundId) {
                const paymentId = refund.order.payment?.razorpayPaymentId;
                if (!paymentId || !this.razorpay.isConfigured()) {
                    throw new common_1.BadRequestException('Razorpay payment not available for refund');
                }
                const result = await this.razorpay.createRefund(paymentId, razorpayAmount, { orderId: refund.orderId, refundId });
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
                                status: client_1.PaymentStatus.REFUNDED,
                                razorpayRefundId: result.id,
                                metadata: { orderRefundId: refundId },
                            },
                        });
                    }
                }
            }
            await this.finalizeRefund(refundId, actorId, ipAddress);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Refund failed';
            this.logger.error({ err, refundId, orderId: refund.orderId }, 'Order refund failed');
            await this.prisma.orderRefund.update({
                where: { id: refundId },
                data: { status: client_1.OrderRefundStatus.FAILED, lastError: message.slice(0, 2000) },
            });
            void this.financeAlerts.raiseRefundFailed(refund.orderId, refundId, message).catch(() => { });
        }
    }
    async finalizeRefund(refundId, actorId, ipAddress) {
        const refund = await this.prisma.orderRefund.findUniqueOrThrow({
            where: { id: refundId },
            include: { order: true },
        });
        if (refund.status === client_1.OrderRefundStatus.REFUNDED)
            return;
        const orderId = refund.orderId;
        const walletAmount = Number(refund.walletAmount);
        if (walletAmount > 0) {
            await this.rewards.refundWalletForOrder(orderId, actorId);
        }
        await this.prisma.$transaction([
            this.prisma.order.update({
                where: { id: orderId },
                data: { status: client_1.OrderStatus.REFUNDED, paymentStatus: client_1.PaymentStatus.REFUNDED },
            }),
            this.prisma.orderStatusHistory.create({
                data: {
                    orderId,
                    status: client_1.OrderStatus.REFUNDED,
                    note: refund.reason ?? 'Refund processed',
                    changedBy: actorId,
                    actorType: client_1.OrderActorType.SYSTEM,
                },
            }),
            this.prisma.orderRefund.update({
                where: { id: refundId },
                data: { status: client_1.OrderRefundStatus.REFUNDED, processedAt: new Date() },
            }),
        ]);
        const payment = await this.prisma.payment.findUnique({ where: { orderId } });
        if (payment) {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: client_1.PaymentStatus.REFUNDED },
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
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.ORDER_REFUNDED, 'order', orderId, { refundId, razorpayRefundId: refund.razorpayRefundId ?? null }, { userId: actorId, ipAddress: ipAddress ?? null }),
        ]);
    }
    computeRefundSplit(order, requestedAmount) {
        const orderRzp = Number(order.razorpayAmount ?? 0);
        const orderWallet = Number(order.walletAmountUsed ?? 0);
        let razorpayAmount = 0;
        let walletAmount = 0;
        if (order.paymentMethod === client_1.PaymentMethod.RAZORPAY || order.paymentMethod === client_1.PaymentMethod.WALLET_RAZORPAY) {
            razorpayAmount = orderRzp;
            walletAmount = orderWallet;
        }
        else if (order.paymentMethod === client_1.PaymentMethod.WALLET) {
            walletAmount = orderWallet || Number(order.totalAmount);
        }
        else if (order.paymentMethod === client_1.PaymentMethod.WALLET_COD) {
            walletAmount = orderWallet;
        }
        else {
            walletAmount = orderWallet;
            razorpayAmount = orderRzp;
        }
        let totalAmount = (0, settlement_utils_1.roundMoney)(razorpayAmount + walletAmount);
        if (requestedAmount != null && requestedAmount > 0) {
            totalAmount = (0, settlement_utils_1.roundMoney)(Math.min(requestedAmount, totalAmount));
            if (totalAmount < razorpayAmount + walletAmount) {
                razorpayAmount = (0, settlement_utils_1.roundMoney)(Math.min(razorpayAmount, totalAmount));
                walletAmount = (0, settlement_utils_1.roundMoney)(totalAmount - razorpayAmount);
            }
        }
        return { walletAmount, razorpayAmount, totalAmount };
    }
    extractRefundEntity(payload) {
        if (!payload)
            return null;
        const refund = payload.refund;
        if (refund && typeof refund === 'object' && !Array.isArray(refund)) {
            const entity = refund.entity;
            if (entity && typeof entity === 'object')
                return entity;
            return refund;
        }
        return null;
    }
};
exports.OrderRefundService = OrderRefundService;
exports.OrderRefundService = OrderRefundService = OrderRefundService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        razorpay_service_1.RazorpayService,
        ledger_service_1.LedgerService,
        reward_service_1.RewardService,
        credit_note_service_1.CreditNoteService,
        email_notification_service_1.EmailNotificationService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        finance_alert_service_1.FinanceAlertService])
], OrderRefundService);
//# sourceMappingURL=order-refund.service.js.map