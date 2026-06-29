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
exports.MerchantCrmService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let MerchantCrmService = class MerchantCrmService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCustomers(userId, storeId) {
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { userId },
            include: { stores: { where: { deletedAt: null }, select: { id: true, name: true } } },
        });
        if (!profile)
            return { repeatCustomers: [], topSpenders: [], loyaltyMembers: [], winBack: [], couponUsers: [], campaignPerformance: [] };
        const storeIds = storeId
            ? profile.stores.filter((s) => s.id === storeId).map((s) => s.id)
            : profile.stores.map((s) => s.id);
        if (storeIds.length === 0) {
            return { repeatCustomers: [], topSpenders: [], loyaltyMembers: [], winBack: [], couponUsers: [], campaignPerformance: [] };
        }
        const since90 = new Date(Date.now() - 90 * 86400000);
        const since60 = new Date(Date.now() - 60 * 86400000);
        const orderGroups = await this.prisma.order.groupBy({
            by: ['buyerProfileId'],
            where: {
                storeId: { in: storeIds },
                status: { in: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.REFUNDED] },
            },
            _count: { _all: true },
            _sum: { totalAmount: true },
            orderBy: { _sum: { totalAmount: 'desc' } },
            take: 100,
        });
        const profileIds = orderGroups.map((g) => g.buyerProfileId);
        const profiles = await this.prisma.buyerProfile.findMany({
            where: { id: { in: profileIds } },
            include: {
                user: { select: { id: true, phone: true } },
                wallet: { select: { tier: true, rewardPoints: true } },
            },
        });
        const profileMap = new Map(profiles.map((p) => [p.id, p]));
        const repeatCustomers = orderGroups
            .filter((g) => g._count._all >= 2)
            .slice(0, 20)
            .map((g) => {
            const p = profileMap.get(g.buyerProfileId);
            return {
                userId: p?.userId,
                name: p?.name,
                phone: p?.user.phone,
                orderCount: g._count._all,
                totalSpent: Number(g._sum.totalAmount ?? 0),
            };
        });
        const topSpenders = orderGroups.slice(0, 10).map((g) => {
            const p = profileMap.get(g.buyerProfileId);
            return {
                userId: p?.userId,
                name: p?.name,
                phone: p?.user.phone,
                totalSpent: Number(g._sum.totalAmount ?? 0),
                orderCount: g._count._all,
            };
        });
        const loyaltyMembers = profiles
            .filter((p) => p.wallet && ['GOLD', 'PLATINUM'].includes(p.wallet.tier))
            .slice(0, 20)
            .map((p) => ({
            userId: p.userId,
            name: p.name,
            phone: p.user.phone,
            tier: p.wallet.tier,
            points: p.wallet.rewardPoints,
        }));
        const recentBuyers = await this.prisma.order.findMany({
            where: { storeId: { in: storeIds }, createdAt: { gte: since90 } },
            select: { buyerProfileId: true },
            distinct: ['buyerProfileId'],
        });
        const recentSet = new Set(recentBuyers.map((o) => o.buyerProfileId));
        const dormantOrders = await this.prisma.order.groupBy({
            by: ['buyerProfileId'],
            where: { storeId: { in: storeIds } },
            _max: { createdAt: true },
        });
        const winBack = dormantOrders
            .filter((d) => d._max.createdAt && d._max.createdAt < since60 && !recentSet.has(d.buyerProfileId))
            .slice(0, 20)
            .map((d) => {
            const p = profileMap.get(d.buyerProfileId);
            return {
                userId: p?.userId,
                name: p?.name,
                phone: p?.user.phone,
                lastOrderAt: d._max.createdAt,
            };
        })
            .filter((w) => w.userId);
        const couponOrders = await this.prisma.order.findMany({
            where: {
                storeId: { in: storeIds },
                OR: [{ couponId: { not: null } }, { discountAmount: { gt: 0 } }],
            },
            select: { buyerProfileId: true },
            distinct: ['buyerProfileId'],
            take: 50,
        });
        const couponUsers = couponOrders.map((o) => {
            const p = profileMap.get(o.buyerProfileId);
            return { userId: p?.userId, name: p?.name, phone: p?.user.phone };
        }).filter((c) => c.userId);
        const campaigns = await this.prisma.campaign.findMany({
            where: { storeId: { in: storeIds } },
            select: {
                id: true,
                name: true,
                status: true,
                impressionCount: true,
                clickCount: true,
                orderCount: true,
                spentAmount: true,
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
        });
        return {
            repeatCustomers,
            topSpenders,
            loyaltyMembers,
            winBack,
            couponUsers,
            campaignPerformance: campaigns.map((c) => ({
                id: c.id,
                name: c.name,
                status: c.status,
                impressions: c.impressionCount,
                clicks: c.clickCount,
                redemptions: c.orderCount,
                spent: Number(c.spentAmount),
            })),
        };
    }
};
exports.MerchantCrmService = MerchantCrmService;
exports.MerchantCrmService = MerchantCrmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MerchantCrmService);
//# sourceMappingURL=merchant-crm.service.js.map