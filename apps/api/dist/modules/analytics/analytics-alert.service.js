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
var AnalyticsAlertService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsAlertService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const client_2 = require("@prisma/client");
let AnalyticsAlertService = AnalyticsAlertService_1 = class AnalyticsAlertService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AnalyticsAlertService_1.name);
    }
    async listOpen(limit = 50) {
        return this.prisma.analyticsAlert.findMany({
            where: { status: { in: [client_1.AnalyticsAlertStatus.OPEN, client_1.AnalyticsAlertStatus.ACKNOWLEDGED] } },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async acknowledge(id) {
        return this.prisma.analyticsAlert.update({
            where: { id },
            data: { status: client_1.AnalyticsAlertStatus.ACKNOWLEDGED },
        });
    }
    async evaluateAfterDailySnapshot(metrics, date) {
        const checks = [
            this.checkOrderSpike(metrics),
            this.checkRevenueDrop(metrics),
            this.checkRiderAvailability(),
            this.checkInventoryCrisis(metrics),
            this.checkWalletFraud(metrics),
            this.checkReferralFraud(metrics),
            this.checkMerchantPerformance(metrics),
        ];
        await Promise.all(checks);
        this.logger.log(`Alert evaluation completed for ${date.toISOString().slice(0, 10)}`);
    }
    async raise(alertType, severity, title, message, metadata) {
        const recent = await this.prisma.analyticsAlert.findFirst({
            where: {
                alertType,
                status: client_1.AnalyticsAlertStatus.OPEN,
                createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
            },
        });
        if (recent)
            return;
        await this.prisma.analyticsAlert.create({
            data: { alertType, severity, title, message, metadata: (metadata ?? undefined) },
        });
    }
    async checkOrderSpike(metrics) {
        const growth = metrics.executive.growthPct.orders;
        if (growth >= 80) {
            await this.raise('ORDER_SPIKE', client_1.AnalyticsAlertSeverity.WARNING, 'Order volume spike', `Orders grew ${growth}% vs prior day (${metrics.executive.orders} orders).`, { growth, orders: metrics.executive.orders });
        }
    }
    async checkRevenueDrop(metrics) {
        const growth = metrics.executive.growthPct.revenue;
        if (growth <= -25 && metrics.executive.revenue > 0) {
            await this.raise('REVENUE_DROP', client_1.AnalyticsAlertSeverity.CRITICAL, 'Revenue drop detected', `Revenue declined ${Math.abs(growth)}% vs prior day.`, { growth, revenue: metrics.executive.revenue });
        }
    }
    async checkRiderAvailability() {
        const online = await this.prisma.riderProfile.count({
            where: { status: { in: [client_2.RiderStatus.ONLINE, client_2.RiderStatus.BUSY, client_2.RiderStatus.ON_DELIVERY] } },
        });
        const unassigned = await this.prisma.order.count({
            where: { status: 'READY_FOR_PICKUP' },
        });
        if (unassigned >= 5 && online < 3) {
            await this.raise('LOW_RIDER_AVAILABILITY', client_1.AnalyticsAlertSeverity.CRITICAL, 'Low rider availability', `${unassigned} orders waiting with only ${online} active riders.`, { unassigned, online });
        }
    }
    async checkInventoryCrisis(metrics) {
        if (metrics.inventory.lowStockRisk >= 50) {
            await this.raise('INVENTORY_CRISIS', client_1.AnalyticsAlertSeverity.WARNING, 'Inventory crisis risk', `${metrics.inventory.lowStockRisk} SKUs at low stock.`, { lowStockRisk: metrics.inventory.lowStockRisk });
        }
    }
    async checkWalletFraud(metrics) {
        const pending = await this.prisma.walletFraudReview.count({ where: { status: 'PENDING' } });
        if (pending >= 10) {
            await this.raise('WALLET_FRAUD_SPIKE', client_1.AnalyticsAlertSeverity.CRITICAL, 'Wallet fraud review spike', `${pending} pending wallet fraud reviews.`, { pending });
        }
        if (metrics.walletRewards.walletDebits > metrics.walletRewards.walletCredits * 2 && metrics.walletRewards.walletDebits > 10000) {
            await this.raise('WALLET_FRAUD_SPIKE', client_1.AnalyticsAlertSeverity.WARNING, 'Unusual wallet debit volume', `Wallet debits (₹${metrics.walletRewards.walletDebits}) exceed credits.`);
        }
    }
    async checkReferralFraud(metrics) {
        const flagged = await this.prisma.referral.count({ where: { status: 'FRAUD_FLAGGED' } });
        if (flagged >= 5) {
            await this.raise('REFERRAL_FRAUD_SPIKE', client_1.AnalyticsAlertSeverity.WARNING, 'Referral fraud flagged', `${flagged} referrals flagged for fraud.`, { flagged });
        }
    }
    async checkMerchantPerformance(metrics) {
        if (metrics.executive.activeMerchants > 0 && metrics.executive.growthPct.orders < -30) {
            await this.raise('MERCHANT_PERFORMANCE_DROP', client_1.AnalyticsAlertSeverity.WARNING, 'Merchant performance drop', `Order growth at ${metrics.executive.growthPct.orders}% with ${metrics.executive.activeMerchants} active merchants.`);
        }
    }
};
exports.AnalyticsAlertService = AnalyticsAlertService;
exports.AnalyticsAlertService = AnalyticsAlertService = AnalyticsAlertService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsAlertService);
//# sourceMappingURL=analytics-alert.service.js.map