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
var CartRecoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartRecoveryService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../database/prisma.service");
const journey_engine_service_1 = require("./journey-engine.service");
const marketing_event_service_1 = require("./marketing-event.service");
const WINDOWS = [
    { minutes: 30, journeyCode: 'CART_ABANDON_30M', eventKey: 'cart_abandon_30' },
    { minutes: 360, journeyCode: 'CART_ABANDON_6H', eventKey: 'cart_abandon_6h' },
    { minutes: 1440, journeyCode: 'CART_ABANDON_24H', eventKey: 'cart_abandon_24h' },
];
let CartRecoveryService = CartRecoveryService_1 = class CartRecoveryService {
    constructor(prisma, journeys, events) {
        this.prisma = prisma;
        this.journeys = journeys;
        this.events = events;
        this.logger = new common_1.Logger(CartRecoveryService_1.name);
    }
    async processAbandonedCarts() {
        for (const window of WINDOWS) {
            const minAge = new Date(Date.now() - window.minutes * 60 * 1000);
            const maxAge = new Date(Date.now() - (window.minutes + 15) * 60 * 1000);
            const carts = await this.prisma.cart.findMany({
                where: {
                    updatedAt: { lte: minAge, gte: maxAge },
                    items: { some: {} },
                },
                include: {
                    buyerProfile: { select: { userId: true } },
                    items: { take: 3, include: { product: { select: { name: true } } } },
                },
                take: 100,
            });
            for (const cart of carts) {
                const userId = cart.buyerProfile.userId;
                const recentOrder = await this.prisma.order.findFirst({
                    where: {
                        buyerProfileId: cart.buyerProfileId,
                        createdAt: { gte: cart.updatedAt },
                    },
                });
                if (recentOrder)
                    continue;
                await this.events.track({
                    userId,
                    eventType: 'CHECKOUT_ABANDON',
                    storeId: cart.storeId,
                    metadata: { cartId: cart.id, window: window.eventKey },
                });
                await this.journeys.enrollUser(window.journeyCode, userId);
            }
        }
        this.logger.debug('Cart recovery scan complete');
    }
};
exports.CartRecoveryService = CartRecoveryService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CartRecoveryService.prototype, "processAbandonedCarts", null);
exports.CartRecoveryService = CartRecoveryService = CartRecoveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journey_engine_service_1.JourneyEngineService,
        marketing_event_service_1.MarketingEventService])
], CartRecoveryService);
//# sourceMappingURL=cart-recovery.service.js.map