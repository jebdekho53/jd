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
var NotificationOrchestratorService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const email_service_1 = require("../email/email.service");
const msg91_service_1 = require("../auth/msg91.service");
const buyer_push_notification_service_1 = require("../push/buyer-push-notification.service");
const configuration_1 = require("../../config/configuration");
const auth_constants_1 = require("../auth/auth.constants");
let NotificationOrchestratorService = NotificationOrchestratorService_1 = class NotificationOrchestratorService {
    constructor(prisma, email, sms, buyerPush, configService) {
        this.prisma = prisma;
        this.email = email;
        this.sms = sms;
        this.buyerPush = buyerPush;
        this.logger = new common_1.Logger(NotificationOrchestratorService_1.name);
        this.cfg = (0, configuration_1.getConfig)(configService);
    }
    async listTemplates(category) {
        return this.prisma.notificationTemplate.findMany({
            where: { isActive: true, ...(category ? { category } : {}) },
            orderBy: { name: 'asc' },
        });
    }
    async getPreferences(userId) {
        return this.prisma.notificationPreference.upsert({
            where: { userId },
            create: { userId },
            update: {},
        });
    }
    async updatePreferences(userId, data) {
        return this.prisma.notificationPreference.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
        });
    }
    async canSend(userId, channel, category) {
        const prefs = await this.getPreferences(userId);
        if (!prefs.marketingConsent && ['OFFERS', 'REFERRALS', 'MARKETING'].includes(category)) {
            return false;
        }
        switch (channel) {
            case client_1.NotificationChannel.PUSH:
                return prefs.pushEnabled;
            case client_1.NotificationChannel.EMAIL:
                return prefs.emailEnabled;
            case client_1.NotificationChannel.SMS:
                return prefs.smsEnabled;
            case client_1.NotificationChannel.WHATSAPP:
                return prefs.whatsappEnabled;
            case client_1.NotificationChannel.IN_APP:
                return true;
            default:
                return true;
        }
    }
    async send(input) {
        const template = await this.prisma.notificationTemplate.findUnique({
            where: { code: input.templateCode },
        });
        if (!template || !template.isActive) {
            throw new Error(`Template ${input.templateCode} not found`);
        }
        const allowed = await this.canSend(input.userId, input.channel, template.category);
        if (!allowed)
            return { skipped: true, reason: 'preferences' };
        if (input.channel === client_1.NotificationChannel.SMS && !this.cfg.auth.smsEnabled) {
            this.logger.log({ userId: input.userId, channel: input.channel }, auth_constants_1.SMS_WHATSAPP_DISABLED_LOG);
            return { skipped: true, reason: 'sms_disabled' };
        }
        if (input.channel === client_1.NotificationChannel.WHATSAPP && !this.cfg.auth.whatsappEnabled) {
            this.logger.log({ userId: input.userId, channel: input.channel }, auth_constants_1.SMS_WHATSAPP_DISABLED_LOG);
            return { skipped: true, reason: 'whatsapp_disabled' };
        }
        const user = await this.prisma.user.findUnique({
            where: { id: input.userId },
            select: { phone: true, email: true },
        });
        if (!user)
            return { skipped: true, reason: 'user_not_found' };
        let body = template.body;
        let subject = template.subject ?? input.title ?? template.name;
        if (input.variables) {
            for (const [k, v] of Object.entries(input.variables)) {
                body = body.replace(new RegExp(`{{${k}}}`, 'g'), v);
                subject = subject.replace(new RegExp(`{{${k}}}`, 'g'), v);
            }
        }
        const recipient = input.channel === client_1.NotificationChannel.EMAIL ? (user.email ?? user.phone) : user.phone;
        const notification = input.channel === client_1.NotificationChannel.IN_APP || input.channel === client_1.NotificationChannel.PUSH
            ? await this.prisma.notification.create({
                data: {
                    userId: input.userId,
                    type: input.type ?? client_1.NotificationType.MARKETING,
                    title: subject,
                    body,
                },
            })
            : null;
        const delivery = await this.prisma.notificationDelivery.create({
            data: {
                notificationId: notification?.id,
                userId: input.userId,
                templateId: template.id,
                channel: input.channel,
                recipient,
                subject,
                body,
                status: client_1.NotificationDeliveryStatus.PENDING,
                queuedAt: new Date(),
            },
        });
        try {
            switch (input.channel) {
                case client_1.NotificationChannel.EMAIL:
                    if (!user.email)
                        throw new Error('No email on file');
                    await this.email.send({
                        to: user.email,
                        subject,
                        html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
                        text: body,
                    });
                    break;
                case client_1.NotificationChannel.SMS:
                case client_1.NotificationChannel.WHATSAPP:
                    if (!user.phone)
                        throw new Error('No phone on file');
                    await this.sms.sendTransactional(user.phone, body);
                    break;
                case client_1.NotificationChannel.PUSH:
                    await this.buyerPush.sendGeneric(input.userId, this.templateCategoryToPushKind(template.category), subject, body);
                    break;
                case client_1.NotificationChannel.IN_APP:
                    break;
                default:
                    break;
            }
            const updated = await this.prisma.notificationDelivery.update({
                where: { id: delivery.id },
                data: {
                    status: client_1.NotificationDeliveryStatus.SENT,
                    sentAt: new Date(),
                    deliveredAt: new Date(),
                },
            });
            return { delivery: updated, notification };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Delivery failed';
            this.logger.warn({ err, userId: input.userId, channel: input.channel }, 'Notification delivery failed');
            await this.prisma.notificationDelivery.update({
                where: { id: delivery.id },
                data: {
                    status: client_1.NotificationDeliveryStatus.FAILED,
                    failedAt: new Date(),
                    errorMessage: message,
                },
            });
            return { delivery, notification, failed: true, error: message };
        }
    }
    async listInApp(userId, page = 1, limit = 20) {
        const [items, total, unread] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.notification.count({ where: { userId } }),
            this.prisma.notification.count({ where: { userId, isRead: false } }),
        ]);
        return { items, total, unread, page, limit };
    }
    async markInAppRead(userId, notificationId) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllInAppRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async listDeliveries(userId, page = 1, limit = 20) {
        const [items, total] = await Promise.all([
            this.prisma.notificationDelivery.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.notificationDelivery.count({ where: { userId } }),
        ]);
        return { items, total, page, limit };
    }
    templateCategoryToPushKind(category) {
        if (category === 'OFFERS' || category === 'MARKETING')
            return 'OFFER_AVAILABLE';
        if (category === 'SUPPORT')
            return 'SUPPORT_REPLY';
        if (category === 'WALLET')
            return 'WALLET_CREDITED';
        return 'ORDER_PLACED';
    }
};
exports.NotificationOrchestratorService = NotificationOrchestratorService;
exports.NotificationOrchestratorService = NotificationOrchestratorService = NotificationOrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => buyer_push_notification_service_1.BuyerPushNotificationService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        msg91_service_1.Msg91Service,
        buyer_push_notification_service_1.BuyerPushNotificationService, typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], NotificationOrchestratorService);
//# sourceMappingURL=notification-orchestrator.service.js.map