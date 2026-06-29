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
var OrderDeliveredHandlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderDeliveredHandlerService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const settlement_service_1 = require("../settlement/settlement.service");
const cod_reconciliation_service_1 = require("../finance/cod-reconciliation.service");
const reservation_service_1 = require("../checkout/reservation.service");
const order_status_history_service_1 = require("../order/order-status-history.service");
const invoice_engine_service_1 = require("../compliance/invoice-engine.service");
const email_notification_service_1 = require("../email/email-notification.service");
const buyer_push_notification_service_1 = require("../push/buyer-push-notification.service");
const trust_safety_hook_service_1 = require("../trust-safety/trust-safety-hook.service");
const wallet_loyalty_checkout_service_1 = require("../wallet-loyalty/wallet-loyalty-checkout.service");
const referral_service_1 = require("../wallet-loyalty/referral.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const tds_tcs_service_1 = require("../compliance/tds-tcs.service");
const distributed_lock_service_1 = require("../../redis/distributed-lock.service");
let OrderDeliveredHandlerService = OrderDeliveredHandlerService_1 = class OrderDeliveredHandlerService {
    constructor(prisma, lock, settlement, cod, reservation, statusHistory, invoiceEngine, emailNotifications, buyerPush, trustSafety, walletLoyalty, referral, domainEvents, tdsTcs) {
        this.prisma = prisma;
        this.lock = lock;
        this.settlement = settlement;
        this.cod = cod;
        this.reservation = reservation;
        this.statusHistory = statusHistory;
        this.invoiceEngine = invoiceEngine;
        this.emailNotifications = emailNotifications;
        this.buyerPush = buyerPush;
        this.trustSafety = trustSafety;
        this.walletLoyalty = walletLoyalty;
        this.referral = referral;
        this.domainEvents = domainEvents;
        this.tdsTcs = tdsTcs;
        this.logger = new common_1.Logger(OrderDeliveredHandlerService_1.name);
    }
    async handleDelivered(ctx) {
        await this.lock.runExclusive(`order-delivered:${ctx.orderId}`, 120, async () => {
            const order = await this.prisma.order.findUnique({
                where: { id: ctx.orderId },
                select: { id: true, status: true, buyerProfileId: true, paymentMethod: true },
            });
            if (!order)
                return;
            if (order.status !== client_1.OrderStatus.DELIVERED &&
                order.status !== client_1.OrderStatus.COMPLETED) {
                await this.statusHistory.transition({
                    orderId: ctx.orderId,
                    toStatus: client_1.OrderStatus.DELIVERED,
                    actorType: client_1.OrderActorType.SYSTEM,
                    actorId: ctx.actorId,
                    note: ctx.providerType
                        ? `Delivered via ${ctx.providerType}`
                        : 'Delivered',
                    skipIfAlreadyStatus: true,
                });
            }
            await this.settlement.createLedgerForDeliveredOrder(ctx.orderId, ctx.actorId);
            const isCod = order.paymentMethod === client_1.PaymentMethod.COD ||
                order.paymentMethod === client_1.PaymentMethod.WALLET_COD;
            if (isCod) {
                await this.cod.createForDeliveredOrder(ctx.orderId, ctx.riderProfileId ?? null, ctx.providerType ?? null);
            }
            if (ctx.deliveryId && ctx.riderProfileId) {
                await this.applyRiderEarningFromSnapshot(ctx.deliveryId, ctx.orderId);
            }
            await this.reservation.fulfillOnDelivery(ctx.orderId).catch((err) => {
                this.logger.error({ err, orderId: ctx.orderId }, 'Inventory fulfillment failed');
            });
            await this.finalizeOrderRewards(ctx.orderId, ctx.actorId).catch((err) => {
                this.logger.error({ err, orderId: ctx.orderId }, 'Order rewards finalization failed');
            });
            await this.invoiceEngine.generateForOrder(ctx.orderId).catch((err) => {
                this.logger.error({ err, orderId: ctx.orderId }, 'GST invoice generation failed');
            });
            void this.syncMonthlyTdsTcs().catch(() => { });
            if (ctx.riderProfileId) {
                void this.trustSafety.onOrderDelivered(ctx.orderId, ctx.riderProfileId).catch(() => { });
            }
            void this.emailNotifications.sendOrderDelivered(ctx.orderId).catch((err) => {
                this.logger.error({ err, orderId: ctx.orderId }, 'Order delivered email failed');
            });
            void this.buyerPush.notifyDelivered(ctx.orderId).catch(() => { });
            void this.domainEvents.emit(client_1.DomainEventType.ORDER_DELIVERED, 'order', ctx.orderId, { providerType: ctx.providerType ?? 'OWN_FLEET' }, { userId: ctx.actorId });
        });
    }
    async handleProviderDelivered(orderId, providerType, deliveryId) {
        await this.handleDelivered({
            orderId,
            actorId: 'logistics-orchestrator',
            providerType,
            deliveryId,
            riderProfileId: null,
        });
    }
    async finalizeOrderRewards(orderId, actorId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, buyerProfileId: true, status: true },
        });
        if (!order || order.status === client_1.OrderStatus.COMPLETED)
            return;
        await this.statusHistory.transition({
            orderId,
            toStatus: client_1.OrderStatus.COMPLETED,
            actorType: client_1.OrderActorType.SYSTEM,
            actorId,
            note: 'Order completed after delivery',
            skipIfAlreadyStatus: true,
        });
        void this.domainEvents.emit(client_1.DomainEventType.ORDER_COMPLETED, 'order', orderId, { buyerProfileId: order.buyerProfileId }, { userId: actorId });
        await this.walletLoyalty.processOrderCompleted(orderId);
        await this.referral.completeReferralOnFirstOrder(order.buyerProfileId, orderId);
    }
    async applyRiderEarningFromSnapshot(deliveryId, orderId) {
        const snap = await this.prisma.orderFinancialSnapshot.findUnique({
            where: { orderId },
            select: { riderPayoutAmount: true },
        });
        if (!snap)
            return;
        await this.prisma.delivery.update({
            where: { id: deliveryId },
            data: { riderEarning: snap.riderPayoutAmount },
        });
    }
    async syncMonthlyTdsTcs() {
        const now = new Date();
        const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        await this.tdsTcs.syncMonthlyFromInvoices(periodMonth);
    }
};
exports.OrderDeliveredHandlerService = OrderDeliveredHandlerService;
exports.OrderDeliveredHandlerService = OrderDeliveredHandlerService = OrderDeliveredHandlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        distributed_lock_service_1.DistributedLockService,
        settlement_service_1.SettlementService,
        cod_reconciliation_service_1.CodReconciliationService,
        reservation_service_1.ReservationService,
        order_status_history_service_1.OrderStatusHistoryService,
        invoice_engine_service_1.InvoiceEngineService,
        email_notification_service_1.EmailNotificationService,
        buyer_push_notification_service_1.BuyerPushNotificationService,
        trust_safety_hook_service_1.TrustSafetyHookService,
        wallet_loyalty_checkout_service_1.WalletLoyaltyCheckoutService,
        referral_service_1.ReferralService,
        domain_events_service_1.DomainEventsService,
        tds_tcs_service_1.TdsTcsService])
], OrderDeliveredHandlerService);
//# sourceMappingURL=order-delivered-handler.service.js.map