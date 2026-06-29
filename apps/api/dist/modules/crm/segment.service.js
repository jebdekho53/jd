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
var SegmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let SegmentService = SegmentService_1 = class SegmentService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SegmentService_1.name);
    }
    async listSegments() {
        return this.prisma.customerSegment.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }
    async getSegmentMembers(segmentId, page = 1, limit = 20) {
        const [items, total] = await Promise.all([
            this.prisma.customerSegmentMember.findMany({
                where: { segmentId },
                skip: (page - 1) * limit,
                take: limit,
                include: { user: { select: { id: true, phone: true, email: true } } },
            }),
            this.prisma.customerSegmentMember.count({ where: { segmentId } }),
        ]);
        return { items, total, page, limit };
    }
    async refreshAllSegments() {
        const segments = await this.prisma.customerSegment.findMany({
            where: { isDynamic: true, isActive: true },
        });
        for (const segment of segments) {
            await this.refreshSegment(segment.id, segment.kind);
        }
        this.logger.log(`Refreshed ${segments.length} dynamic segments`);
    }
    async refreshSegment(segmentId, kind) {
        const userIds = await this.resolveUserIds(kind);
        await this.prisma.customerSegmentMember.deleteMany({ where: { segmentId } });
        if (userIds.length > 0) {
            await this.prisma.customerSegmentMember.createMany({
                data: userIds.map((userId) => ({ segmentId, userId })),
                skipDuplicates: true,
            });
        }
        await this.prisma.customerSegment.update({
            where: { id: segmentId },
            data: { memberCount: userIds.length, lastRefreshedAt: new Date() },
        });
        return userIds.length;
    }
    async resolveUserIds(kind) {
        const since14 = new Date(Date.now() - 14 * 86400000);
        const since30 = new Date(Date.now() - 30 * 86400000);
        const since60 = new Date(Date.now() - 60 * 86400000);
        const since90 = new Date(Date.now() - 90 * 86400000);
        switch (kind) {
            case client_1.SegmentKind.NEW_USERS: {
                const users = await this.prisma.user.findMany({
                    where: { buyerProfile: { isNot: null }, createdAt: { gte: since14 } },
                    select: { id: true },
                    take: 5000,
                });
                return users.map((u) => u.id);
            }
            case client_1.SegmentKind.ACTIVE_USERS: {
                const orders = await this.prisma.order.findMany({
                    where: { createdAt: { gte: since30 }, status: { notIn: [client_1.OrderStatus.CANCELLED_BY_BUYER, client_1.OrderStatus.CANCELLED_BY_MERCHANT] } },
                    select: { buyerProfile: { select: { userId: true } } },
                    distinct: ['buyerProfileId'],
                    take: 5000,
                });
                return orders.map((o) => o.buyerProfile.userId);
            }
            case client_1.SegmentKind.DORMANT_USERS: {
                const active = await this.resolveUserIds(client_1.SegmentKind.ACTIVE_USERS);
                const all = await this.prisma.user.findMany({
                    where: { buyerProfile: { isNot: null } },
                    select: { id: true },
                    take: 5000,
                });
                const activeSet = new Set(active);
                return all.filter((u) => !activeSet.has(u.id)).map((u) => u.id);
            }
            case client_1.SegmentKind.WALLET_USERS: {
                const wallets = await this.prisma.buyerWallet.findMany({
                    where: { balance: { gt: 0 } },
                    select: { buyerProfile: { select: { userId: true } } },
                    take: 5000,
                });
                return wallets.map((w) => w.buyerProfile.userId);
            }
            case client_1.SegmentKind.GOLD_MEMBERS:
            case client_1.SegmentKind.PLATINUM_MEMBERS: {
                const tier = kind === client_1.SegmentKind.GOLD_MEMBERS ? client_1.LoyaltyTier.GOLD : client_1.LoyaltyTier.PLATINUM;
                const wallets = await this.prisma.buyerWallet.findMany({
                    where: { tier },
                    select: { buyerProfile: { select: { userId: true } } },
                    take: 5000,
                });
                return wallets.map((w) => w.buyerProfile.userId);
            }
            case client_1.SegmentKind.HIGH_COD_RISK: {
                const profiles = await this.prisma.buyerProfile.findMany({
                    where: { codEnabled: false },
                    select: { userId: true },
                    take: 5000,
                });
                return profiles.map((p) => p.userId);
            }
            case client_1.SegmentKind.HIGH_REFUND_USERS: {
                const refunded = await this.prisma.order.groupBy({
                    by: ['buyerProfileId'],
                    where: { status: client_1.OrderStatus.REFUNDED },
                    _count: { _all: true },
                });
                const profileIds = refunded
                    .filter((r) => r._count._all >= 2)
                    .map((r) => r.buyerProfileId);
                const profiles = await this.prisma.buyerProfile.findMany({
                    where: { id: { in: profileIds } },
                    select: { userId: true },
                });
                return profiles.map((p) => p.userId);
            }
            case client_1.SegmentKind.FREQUENT_BUYERS: {
                const grouped = await this.prisma.order.groupBy({
                    by: ['buyerProfileId'],
                    where: { createdAt: { gte: since90 } },
                    _count: { _all: true },
                });
                const frequent = grouped.filter((g) => g._count._all >= 5).map((g) => g.buyerProfileId);
                const profiles = await this.prisma.buyerProfile.findMany({
                    where: { id: { in: frequent } },
                    select: { userId: true },
                });
                return profiles.map((p) => p.userId);
            }
            case client_1.SegmentKind.HIGH_VALUE_USERS:
            case client_1.SegmentKind.VIP_USERS: {
                const minLtv = kind === client_1.SegmentKind.VIP_USERS ? 15000 : 5000;
                const grouped = await this.prisma.order.groupBy({
                    by: ['buyerProfileId'],
                    where: { status: { in: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.REFUNDED] } },
                    _sum: { totalAmount: true },
                });
                const high = grouped
                    .filter((g) => Number(g._sum.totalAmount ?? 0) >= minLtv)
                    .map((g) => g.buyerProfileId);
                const profiles = await this.prisma.buyerProfile.findMany({
                    where: { id: { in: high } },
                    select: { userId: true },
                });
                return profiles.map((p) => p.userId);
            }
            default:
                return [];
        }
    }
};
exports.SegmentService = SegmentService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SegmentService.prototype, "refreshAllSegments", null);
exports.SegmentService = SegmentService = SegmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SegmentService);
//# sourceMappingURL=segment.service.js.map