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
exports.Customer360Service = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const customer_timeline_service_1 = require("../support/customer-timeline.service");
let Customer360Service = class Customer360Service {
    constructor(prisma, timeline) {
        this.prisma = prisma;
        this.timeline = timeline;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                buyerProfile: {
                    include: {
                        wallet: true,
                        orders: {
                            orderBy: { createdAt: 'desc' },
                            take: 10,
                            select: {
                                id: true,
                                orderNumber: true,
                                status: true,
                                totalAmount: true,
                                createdAt: true,
                            },
                        },
                    },
                },
                segmentMemberships: { include: { segment: true } },
                customerUserTags: { include: { tag: true } },
                notificationPreference: true,
            },
        });
        if (!user?.buyerProfile)
            throw new common_1.NotFoundException('Buyer not found');
        const [timeline, searches, campaignEvents, deliveries] = await Promise.all([
            this.timeline.getTimeline(userId),
            this.prisma.marketingEvent.findMany({
                where: { userId, eventType: 'SEARCH' },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
            this.prisma.marketingEvent.findMany({
                where: {
                    userId,
                    eventType: { in: ['CAMPAIGN_CLICK', 'CAMPAIGN_OPEN', 'NOTIFICATION_OPEN'] },
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
            this.prisma.notificationDelivery.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
        ]);
        const carts = await this.prisma.cart.findMany({
            where: { buyerProfileId: user.buyerProfile.id },
            include: { items: true, store: { select: { name: true } } },
        });
        const orderStats = await this.prisma.order.aggregate({
            where: { buyerProfileId: user.buyerProfile.id },
            _count: true,
            _sum: { totalAmount: true },
        });
        return {
            user: {
                id: user.id,
                phone: user.phone,
                email: user.email,
                name: user.buyerProfile.name,
                createdAt: user.createdAt,
            },
            segments: user.segmentMemberships.map((m) => m.segment),
            tags: user.customerUserTags.map((t) => t.tag),
            preferences: user.notificationPreference,
            wallet: user.buyerProfile.wallet,
            orders: user.buyerProfile.orders,
            carts,
            timeline: timeline.events,
            searches,
            campaignEngagement: campaignEvents,
            notificationHistory: deliveries,
            metrics: {
                totalOrders: orderStats._count,
                lifetimeValue: Number(orderStats._sum.totalAmount ?? 0),
            },
        };
    }
};
exports.Customer360Service = Customer360Service;
exports.Customer360Service = Customer360Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        customer_timeline_service_1.CustomerTimelineService])
], Customer360Service);
//# sourceMappingURL=customer-360.service.js.map