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
var FraudEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudEngineService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const finance_alert_service_1 = require("../finance/finance-alert.service");
const distributed_lock_service_1 = require("../../redis/distributed-lock.service");
const LOOKBACK_DAYS = 30;
let FraudEngineService = FraudEngineService_1 = class FraudEngineService {
    constructor(prisma, alerts, lock) {
        this.prisma = prisma;
        this.alerts = alerts;
        this.lock = lock;
        this.logger = new common_1.Logger(FraudEngineService_1.name);
    }
    async runHourlyScan() {
        await this.lock.runExclusive('cron:fraud-engine', 3000, async () => {
            const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000);
            await Promise.all([
                this.scanRefundAbuse(since),
                this.scanCancellationAbuse(since),
                this.scanCodFailures(since),
                this.scanCouponFarming(since),
                this.scanReferralAbuse(since),
                this.scanWalletAbuse(since),
                this.scanAiBillingAbuse(since),
            ]);
            this.logger.debug('Fraud engine hourly scan completed');
        });
    }
    async scanRefundAbuse(since) {
        const rows = await this.prisma.orderRefund.groupBy({
            by: ['orderId'],
            where: { createdAt: { gte: since }, status: client_1.OrderRefundStatus.REFUNDED },
            _count: { id: true },
        });
        const orderIds = rows.filter((r) => r._count.id >= 2).map((r) => r.orderId);
        for (const orderId of orderIds.slice(0, 10)) {
            await this.alerts.raiseFraudAlert({
                alertType: client_1.FinanceAlertType.FRAUD_REFUND_ABUSE,
                severity: client_1.FinanceAlertSeverity.WARNING,
                title: `Multiple refunds on order ${orderId}`,
                message: 'Order has more than one successful refund in 30 days',
                metadata: { orderId },
            });
        }
        const buyerRefunds = await this.prisma.$queryRaw `
      SELECT o.buyer_profile_id, COUNT(r.id)::bigint AS cnt
      FROM order_refunds r
      JOIN orders o ON o.id = r.order_id
      WHERE r.created_at >= ${since} AND r.status = 'REFUNDED'
      GROUP BY o.buyer_profile_id
      HAVING COUNT(r.id) >= 5
      LIMIT 20
    `;
        for (const row of buyerRefunds) {
            await this.alerts.raiseFraudAlert({
                alertType: client_1.FinanceAlertType.FRAUD_HIGH_RISK_BUYER,
                severity: client_1.FinanceAlertSeverity.WARNING,
                title: `High refund volume buyer ${row.buyer_profile_id}`,
                message: `Buyer has ${row.cnt} refunds in ${LOOKBACK_DAYS} days`,
                metadata: { buyerProfileId: row.buyer_profile_id, count: Number(row.cnt) },
            });
        }
    }
    async scanCancellationAbuse(since) {
        const rows = await this.prisma.$queryRaw `
      SELECT buyer_profile_id, COUNT(id)::bigint AS cnt
      FROM orders
      WHERE created_at >= ${since}
        AND status IN ('CANCELLED_BY_BUYER', 'CANCELLED_BY_MERCHANT', 'CANCELLED_BY_ADMIN')
      GROUP BY buyer_profile_id
      HAVING COUNT(id) >= 10
      LIMIT 20
    `;
        for (const row of rows) {
            await this.alerts.raiseFraudAlert({
                alertType: client_1.FinanceAlertType.FRAUD_CANCELLATION_ABUSE,
                severity: client_1.FinanceAlertSeverity.INFO,
                title: `Frequent cancellations: buyer ${row.buyer_profile_id}`,
                message: `${row.cnt} cancellations in ${LOOKBACK_DAYS} days`,
                metadata: { buyerProfileId: row.buyer_profile_id },
            });
        }
    }
    async scanCodFailures(since) {
        const rows = await this.prisma.$queryRaw `
      SELECT buyer_profile_id, COUNT(id)::bigint AS cnt
      FROM orders
      WHERE created_at >= ${since}
        AND payment_method IN ('COD', 'WALLET_COD')
        AND status = 'DELIVERY_FAILED'
      GROUP BY buyer_profile_id
      HAVING COUNT(id) >= 3
      LIMIT 20
    `;
        for (const row of rows) {
            await this.alerts.raiseFraudAlert({
                alertType: client_1.FinanceAlertType.FRAUD_COD_FAILURES,
                severity: client_1.FinanceAlertSeverity.WARNING,
                title: `Repeated COD delivery failures`,
                message: `Buyer ${row.buyer_profile_id}: ${row.cnt} failed COD deliveries`,
                metadata: { buyerProfileId: row.buyer_profile_id },
            });
        }
    }
    async scanCouponFarming(since) {
        const rows = await this.prisma.couponUsage.groupBy({
            by: ['buyerProfileId'],
            where: { createdAt: { gte: since } },
            _count: { id: true },
        });
        for (const row of rows.filter((r) => r._count.id >= 8).slice(0, 15)) {
            await this.alerts.raiseFraudAlert({
                alertType: client_1.FinanceAlertType.FRAUD_COUPON_FARMING,
                severity: client_1.FinanceAlertSeverity.INFO,
                title: `High coupon usage: ${row.buyerProfileId}`,
                message: `${row._count.id} coupon redemptions in ${LOOKBACK_DAYS} days`,
                metadata: { buyerProfileId: row.buyerProfileId },
            });
        }
    }
    async scanReferralAbuse(since) {
        const rows = await this.prisma.referral.groupBy({
            by: ['referrerWalletId'],
            where: { createdAt: { gte: since }, status: 'COMPLETED' },
            _count: { id: true },
        });
        for (const row of rows.filter((r) => r._count.id >= 10).slice(0, 10)) {
            await this.alerts.raiseFraudAlert({
                alertType: client_1.FinanceAlertType.FRAUD_REFERRAL_ABUSE,
                severity: client_1.FinanceAlertSeverity.WARNING,
                title: `Referral farming suspected`,
                message: `Referrer wallet ${row.referrerWalletId}: ${row._count.id} completions`,
                metadata: { referrerWalletId: row.referrerWalletId },
            });
        }
    }
    async scanWalletAbuse(since) {
        const rows = await this.prisma.walletTransaction.groupBy({
            by: ['walletId'],
            where: {
                createdAt: { gte: since },
                type: 'REFUND',
            },
            _sum: { amount: true },
            _count: { id: true },
        });
        for (const row of rows.filter((r) => r._count.id >= 6).slice(0, 10)) {
            await this.alerts.raiseFraudAlert({
                alertType: client_1.FinanceAlertType.FRAUD_WALLET_ABUSE,
                severity: client_1.FinanceAlertSeverity.INFO,
                title: `High wallet refund activity`,
                message: `Wallet ${row.walletId}: ${row._count.id} refund credits`,
                metadata: { walletId: row.walletId },
            });
        }
    }
    async scanAiBillingAbuse(since) {
        const rows = await this.prisma.merchantAiWalletTransaction.groupBy({
            by: ['merchantProfileId'],
            where: { createdAt: { gte: since }, type: 'DEBIT' },
            _count: { id: true },
        });
        for (const row of rows.filter((r) => r._count.id >= 50).slice(0, 10)) {
            await this.alerts.raiseFraudAlert({
                alertType: client_1.FinanceAlertType.FRAUD_AI_BILLING_ABUSE,
                severity: client_1.FinanceAlertSeverity.INFO,
                title: `High AI wallet usage`,
                message: `Merchant ${row.merchantProfileId}: ${row._count.id} AI debits`,
                metadata: { merchantProfileId: row.merchantProfileId },
            });
        }
    }
};
exports.FraudEngineService = FraudEngineService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FraudEngineService.prototype, "runHourlyScan", null);
exports.FraudEngineService = FraudEngineService = FraudEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        finance_alert_service_1.FinanceAlertService,
        distributed_lock_service_1.DistributedLockService])
], FraudEngineService);
//# sourceMappingURL=fraud-engine.service.js.map