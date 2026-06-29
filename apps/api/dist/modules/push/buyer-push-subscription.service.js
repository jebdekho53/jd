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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerPushSubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const web_push_service_1 = require("./web-push.service");
let BuyerPushSubscriptionService = class BuyerPushSubscriptionService {
    constructor(prisma, webPush) {
        this.prisma = prisma;
        this.webPush = webPush;
    }
    getStatus(userId) {
        return this.prisma.pushSubscription.count({
            where: { userId, isActive: true },
        });
    }
    async getPushStatus(userId) {
        const activeCount = await this.getStatus(userId);
        return {
            configured: this.webPush.isConfigured(),
            publicKey: this.webPush.isConfigured() ? this.webPush.getPublicKey() : null,
            subscribed: activeCount > 0,
            activeSubscriptions: activeCount,
        };
    }
    async subscribe(userId, dto) {
        const deviceType = dto.deviceType ?? client_1.PushDeviceType.UNKNOWN;
        const now = new Date();
        return this.prisma.pushSubscription.upsert({
            where: { endpoint: dto.endpoint },
            create: {
                userId,
                endpoint: dto.endpoint,
                p256dh: dto.p256dh,
                auth: dto.auth,
                userAgent: dto.userAgent,
                deviceType,
                isActive: true,
                lastSeenAt: now,
            },
            update: {
                userId,
                p256dh: dto.p256dh,
                auth: dto.auth,
                userAgent: dto.userAgent,
                deviceType,
                isActive: true,
                lastSeenAt: now,
            },
        });
    }
    async unsubscribe(userId, dto) {
        const result = await this.prisma.pushSubscription.updateMany({
            where: { userId, endpoint: dto.endpoint },
            data: { isActive: false },
        });
        return { updated: result.count };
    }
};
exports.BuyerPushSubscriptionService = BuyerPushSubscriptionService;
exports.BuyerPushSubscriptionService = BuyerPushSubscriptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        web_push_service_1.WebPushService])
], BuyerPushSubscriptionService);
//# sourceMappingURL=buyer-push-subscription.service.js.map