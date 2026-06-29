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
exports.BuyerPushListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const wallet_loyalty_events_1 = require("../wallet-loyalty/wallet-loyalty.events");
const prisma_service_1 = require("../../database/prisma.service");
const buyer_push_notification_service_1 = require("./buyer-push-notification.service");
const buyer_push_events_1 = require("./buyer-push.events");
let BuyerPushListener = class BuyerPushListener {
    constructor(push, prisma) {
        this.push = push;
        this.prisma = prisma;
    }
    async onWalletCredited(payload) {
        const profile = await this.prisma.buyerProfile.findUnique({
            where: { id: payload.buyerProfileId },
            select: { userId: true },
        });
        if (!profile)
            return;
        await this.push.notifyWalletCredited(profile.userId, payload.amount);
    }
    async onSupportReply(payload) {
        await this.push.notifySupportReply(payload.userId, payload.ticketId, payload.ticketNumber);
    }
};
exports.BuyerPushListener = BuyerPushListener;
__decorate([
    (0, event_emitter_1.OnEvent)(wallet_loyalty_events_1.WALLET_LOYALTY_EVENTS.WALLET_CREDITED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyerPushListener.prototype, "onWalletCredited", null);
__decorate([
    (0, event_emitter_1.OnEvent)(buyer_push_events_1.BUYER_PUSH_EVENTS.SUPPORT_REPLY),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyerPushListener.prototype, "onSupportReply", null);
exports.BuyerPushListener = BuyerPushListener = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [buyer_push_notification_service_1.BuyerPushNotificationService,
        prisma_service_1.PrismaService])
], BuyerPushListener);
//# sourceMappingURL=buyer-push.listener.js.map