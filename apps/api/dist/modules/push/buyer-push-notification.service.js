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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BuyerPushNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerPushNotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
const notification_orchestrator_service_1 = require("../crm/notification-orchestrator.service");
const push_payload_builder_1 = require("./push-payload.builder");
const web_push_service_1 = require("./web-push.service");
let BuyerPushNotificationService = BuyerPushNotificationService_1 = class BuyerPushNotificationService {
    constructor(prisma, webPush, notifications, configService) {
        this.prisma = prisma;
        this.webPush = webPush;
        this.notifications = notifications;
        this.logger = new common_1.Logger(BuyerPushNotificationService_1.name);
        this.buyerSiteUrl = configService.get('BUYER_SITE_URL', 'https://jebdekho.com').replace(/\/$/, '');
    }
    async sendToUser(userId, kind, payload) {
        if (!this.webPush.isConfigured())
            return;
        const prefs = await this.notifications.getPreferences(userId);
        if (!this.isAllowed(kind, prefs))
            return;
        const subs = await this.prisma.pushSubscription.findMany({
            where: { userId, isActive: true },
        });
        if (!subs.length)
            return;
        const body = (0, push_payload_builder_1.serializePushPayload)({
            ...payload,
            data: {
                ...payload.data,
                url: payload.data.url.startsWith('http')
                    ? payload.data.url
                    : `${this.buyerSiteUrl}${payload.data.url}`,
            },
        });
        await Promise.all(subs.map(async (sub) => {
            try {
                const { statusCode } = await this.webPush.send(sub, body);
                if (statusCode >= 200 && statusCode < 300) {
                    await this.prisma.pushSubscription.update({
                        where: { id: sub.id },
                        data: { lastSeenAt: new Date() },
                    });
                }
            }
            catch (err) {
                const statusCode = err.statusCode;
                if (statusCode === 404 || statusCode === 410) {
                    await this.prisma.pushSubscription.update({
                        where: { id: sub.id },
                        data: { isActive: false },
                    });
                    this.logger.debug({ endpoint: sub.endpoint, statusCode }, 'Deactivated dead push subscription');
                    return;
                }
                this.logger.warn({ err, userId, kind }, 'Push delivery failed');
            }
        }));
    }
    isAllowed(kind, prefs) {
        if (!prefs.pushEnabled)
            return false;
        switch (kind) {
            case 'ORDER_PLACED':
            case 'ORDER_ACCEPTED':
            case 'READY_FOR_PICKUP':
            case 'RIDER_ASSIGNED':
            case 'OUT_FOR_DELIVERY':
            case 'DELIVERED':
                return prefs.orderUpdates;
            case 'WALLET_CREDITED':
                return prefs.walletAlerts;
            case 'OFFER_AVAILABLE':
                return prefs.offerAlerts && prefs.marketingConsent;
            case 'SUPPORT_REPLY':
                return prefs.supportAlerts;
            default:
                return true;
        }
    }
    async notifyOrderPlaced(orderId) {
        const order = await this.loadOrder(orderId);
        if (!order)
            return;
        await this.sendToUser(order.userId, 'ORDER_PLACED', (0, push_payload_builder_1.buildBuyerPushPayload)('ORDER_PLACED', {
            title: 'Order placed',
            body: `Your order #${order.orderNumber} has been placed successfully.`,
            orderId,
        }));
    }
    async notifyOrderAccepted(orderId) {
        const order = await this.loadOrder(orderId);
        if (!order)
            return;
        await this.sendToUser(order.userId, 'ORDER_ACCEPTED', (0, push_payload_builder_1.buildBuyerPushPayload)('ORDER_ACCEPTED', {
            title: 'Order confirmed',
            body: `Store accepted your order #${order.orderNumber}.`,
            orderId,
        }));
    }
    async notifyReadyForPickup(orderId) {
        const order = await this.loadOrder(orderId);
        if (!order)
            return;
        await this.sendToUser(order.userId, 'READY_FOR_PICKUP', (0, push_payload_builder_1.buildBuyerPushPayload)('READY_FOR_PICKUP', {
            title: 'Ready for pickup',
            body: `Order #${order.orderNumber} is packed and ready.`,
            orderId,
        }));
    }
    async notifyRiderAssigned(orderId) {
        const order = await this.loadOrder(orderId);
        if (!order)
            return;
        await this.sendToUser(order.userId, 'RIDER_ASSIGNED', (0, push_payload_builder_1.buildBuyerPushPayload)('RIDER_ASSIGNED', {
            title: 'Rider assigned',
            body: `A delivery partner is on the way for order #${order.orderNumber}.`,
            orderId,
        }));
    }
    async notifyOutForDelivery(orderId) {
        const order = await this.loadOrder(orderId);
        if (!order)
            return;
        await this.sendToUser(order.userId, 'OUT_FOR_DELIVERY', (0, push_payload_builder_1.buildBuyerPushPayload)('OUT_FOR_DELIVERY', {
            title: 'Out for delivery',
            body: `Order #${order.orderNumber} is on its way to you.`,
            orderId,
        }));
    }
    async notifyDelivered(orderId) {
        const order = await this.loadOrder(orderId);
        if (!order)
            return;
        await this.sendToUser(order.userId, 'DELIVERED', (0, push_payload_builder_1.buildBuyerPushPayload)('DELIVERED', {
            title: 'Delivered',
            body: `Order #${order.orderNumber} has been delivered. Enjoy!`,
            orderId,
        }));
    }
    async notifyWalletCredited(userId, amount) {
        await this.sendToUser(userId, 'WALLET_CREDITED', (0, push_payload_builder_1.buildBuyerPushPayload)('WALLET_CREDITED', {
            title: 'Wallet credited',
            body: `₹${amount.toFixed(2)} has been added to your JebDekho wallet.`,
        }));
    }
    async notifySupportReply(userId, ticketId, ticketNumber) {
        await this.sendToUser(userId, 'SUPPORT_REPLY', (0, push_payload_builder_1.buildBuyerPushPayload)('SUPPORT_REPLY', {
            title: 'Support reply',
            body: `You have a new reply on ticket #${ticketNumber}.`,
            ticketId,
        }));
    }
    async notifyOfferAvailable(userId, offerName, offerId) {
        await this.sendToUser(userId, 'OFFER_AVAILABLE', (0, push_payload_builder_1.buildBuyerPushPayload)('OFFER_AVAILABLE', {
            title: 'New offer for you',
            body: offerName,
            offerId,
        }));
    }
    async sendGeneric(userId, kind, title, body) {
        await this.sendToUser(userId, kind, (0, push_payload_builder_1.buildBuyerPushPayload)(kind, { title, body }));
    }
    async loadOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                orderNumber: true,
                buyerProfile: { select: { userId: true } },
            },
        });
        if (!order?.buyerProfile)
            return null;
        return { userId: order.buyerProfile.userId, orderNumber: order.orderNumber };
    }
};
exports.BuyerPushNotificationService = BuyerPushNotificationService;
exports.BuyerPushNotificationService = BuyerPushNotificationService = BuyerPushNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => notification_orchestrator_service_1.NotificationOrchestratorService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        web_push_service_1.WebPushService,
        notification_orchestrator_service_1.NotificationOrchestratorService,
        config_1.ConfigService])
], BuyerPushNotificationService);
//# sourceMappingURL=buyer-push-notification.service.js.map