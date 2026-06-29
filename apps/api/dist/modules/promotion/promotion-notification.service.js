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
var PromotionNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionNotificationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let PromotionNotificationService = PromotionNotificationService_1 = class PromotionNotificationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PromotionNotificationService_1.name);
    }
    async notifyStorePromotion(storeId, promotionName) {
        const buyers = await this.prisma.cart.findMany({
            where: { storeId },
            select: { buyerProfile: { select: { userId: true } } },
            distinct: ['buyerProfileId'],
            take: 100,
        });
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { name: true, slug: true },
        });
        if (!store)
            return;
        const title = `New offer at ${store.name}`;
        const body = `${promotionName} — shop now before it ends!`;
        for (const row of buyers) {
            const userId = row.buyerProfile.userId;
            await this.createInApp(userId, title, body, {
                type: 'STORE_PROMOTION',
                storeSlug: store.slug,
            });
        }
        this.logger.log(`Promotion alerts queued for ${buyers.length} buyers at store ${storeId}`);
    }
    async notifyCouponExpiring(userId, couponCode, expiresAt) {
        await this.createInApp(userId, 'Coupon expiring soon', `Your coupon ${couponCode} expires on ${expiresAt.toLocaleDateString('en-IN')}`, { type: 'COUPON_EXPIRY', code: couponCode });
    }
    async notifyOfferExpiring(userId, offerName, storeName) {
        await this.createInApp(userId, 'Offer ending soon', `${offerName} at ${storeName} is about to expire`, { type: 'OFFER_EXPIRY', offerName, storeName });
    }
    async createInApp(userId, title, body, data) {
        await this.prisma.notification.create({
            data: {
                userId,
                type: client_1.NotificationType.PROMOTION,
                title,
                body,
                data,
            },
        });
    }
};
exports.PromotionNotificationService = PromotionNotificationService;
exports.PromotionNotificationService = PromotionNotificationService = PromotionNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromotionNotificationService);
//# sourceMappingURL=promotion-notification.service.js.map