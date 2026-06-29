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
exports.RiderPayoutService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
const ledger_service_1 = require("./ledger.service");
const finance_cache_service_1 = require("./finance-cache.service");
const settlement_utils_1 = require("../settlement/settlement.utils");
let RiderPayoutService = class RiderPayoutService {
    constructor(prisma, ledger, cache) {
        this.prisma = prisma;
        this.ledger = ledger;
        this.cache = cache;
    }
    async getRiderEarnings(riderProfileId) {
        const todayStart = (0, ist_day_util_1.startOfIstDay)();
        const weekStart = (0, ist_day_util_1.startOfIstWeek)();
        const deliveries = await this.prisma.delivery.findMany({
            where: { riderProfileId, status: client_1.DeliveryStatus.DELIVERED },
            include: { order: { select: { orderNumber: true, paymentMethod: true, totalAmount: true } } },
            orderBy: { deliveredAt: 'desc' },
            take: 100,
        });
        const sum = (from) => deliveries
            .filter((d) => d.deliveredAt && d.deliveredAt >= from)
            .reduce((s, d) => s + (0, settlement_utils_1.decimalToNumber)(d.riderEarning ?? 0), 0);
        const [pendingPayout, paidPayouts] = await Promise.all([
            this.prisma.riderPayout.findFirst({
                where: { riderProfileId, status: client_1.RiderPayoutStatus.PENDING },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.riderPayout.aggregate({
                where: { riderProfileId, status: client_1.RiderPayoutStatus.PAID },
                _sum: { totalAmount: true },
            }),
        ]);
        return {
            today: (0, settlement_utils_1.roundMoney)(sum(todayStart)),
            thisWeek: (0, settlement_utils_1.roundMoney)(sum(weekStart)),
            pendingPayout: pendingPayout ? (0, settlement_utils_1.decimalToNumber)(pendingPayout.totalAmount) : 0,
            totalPaid: (0, settlement_utils_1.decimalToNumber)(paidPayouts._sum.totalAmount),
            recentDeliveries: deliveries.slice(0, 10).map((d) => ({
                orderNumber: d.order.orderNumber,
                earning: (0, settlement_utils_1.decimalToNumber)(d.riderEarning ?? 0),
                deliveredAt: d.deliveredAt?.toISOString() ?? null,
                paymentMethod: d.order.paymentMethod,
            })),
        };
    }
    async generateWeeklyPayout(riderProfileId) {
        const weekStart = (0, ist_day_util_1.startOfIstWeek)();
        const weekEnd = new Date();
        const deliveries = await this.prisma.delivery.findMany({
            where: {
                riderProfileId,
                status: client_1.DeliveryStatus.DELIVERED,
                deliveredAt: { gte: weekStart, lte: weekEnd },
                riderPayoutItems: { none: {} },
            },
            include: { order: { select: { id: true, financialSnapshot: true } } },
        });
        if (deliveries.length === 0)
            return null;
        let baseFee = 0;
        let distanceBonus = 0;
        for (const d of deliveries) {
            const earning = (0, settlement_utils_1.decimalToNumber)(d.riderEarning ?? 0);
            baseFee += earning * 0.7;
            distanceBonus += earning * 0.3;
        }
        baseFee = (0, settlement_utils_1.roundMoney)(baseFee);
        distanceBonus = (0, settlement_utils_1.roundMoney)(distanceBonus);
        const total = (0, settlement_utils_1.roundMoney)(baseFee + distanceBonus);
        const payout = await this.prisma.riderPayout.create({
            data: {
                riderProfileId,
                periodStart: weekStart,
                periodEnd: weekEnd,
                baseFee,
                distanceBonus,
                totalAmount: total,
                items: {
                    create: deliveries.map((d) => ({
                        deliveryId: d.id,
                        orderId: d.orderId,
                        amount: d.riderEarning ?? 0,
                    })),
                },
            },
        });
        await this.cache.invalidatePayouts();
        return payout;
    }
    async markPaid(payoutId, adminUserId, referenceId) {
        const payout = await this.prisma.riderPayout.update({
            where: { id: payoutId },
            data: {
                status: client_1.RiderPayoutStatus.PAID,
                paidAt: new Date(),
                referenceId,
            },
        });
        await this.ledger.recordRiderPayout(payoutId, payout.riderProfileId, (0, settlement_utils_1.decimalToNumber)(payout.totalAmount));
        await this.cache.invalidatePayouts();
        return payout;
    }
    async listAdmin(page = 1, limit = 25) {
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.riderPayout.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { riderProfile: { select: { name: true } }, _count: { select: { items: true } } },
            }),
            this.prisma.riderPayout.count(),
        ]);
        return {
            payouts: rows.map((p) => ({
                id: p.id,
                rider: p.riderProfile.name,
                riderProfileId: p.riderProfileId,
                status: p.status,
                totalAmount: (0, settlement_utils_1.decimalToNumber)(p.totalAmount),
                deliveryCount: p._count.items,
                periodStart: p.periodStart.toISOString(),
                periodEnd: p.periodEnd.toISOString(),
                paidAt: p.paidAt?.toISOString() ?? null,
            })),
            meta: { page, limit, total },
        };
    }
};
exports.RiderPayoutService = RiderPayoutService;
exports.RiderPayoutService = RiderPayoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        finance_cache_service_1.FinanceCacheService])
], RiderPayoutService);
//# sourceMappingURL=rider-payout.service.js.map