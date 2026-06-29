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
exports.FinanceAlertService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let FinanceAlertService = class FinanceAlertService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async raiseSettlementFailure(merchantProfileId, reason) {
        await this.create({
            alertType: client_1.FinanceAlertType.SETTLEMENT_FAILURE,
            severity: client_1.FinanceAlertSeverity.CRITICAL,
            title: 'Settlement batch failed',
            message: reason,
            metadata: { merchantProfileId },
        });
    }
    async raiseCodMismatch(riderProfileId, amount) {
        await this.create({
            alertType: client_1.FinanceAlertType.COD_MISMATCH,
            severity: client_1.FinanceAlertSeverity.WARNING,
            title: 'COD remittance mismatch',
            message: `Rider remittance mismatch of ₹${amount}`,
            metadata: { riderProfileId, amount },
        });
    }
    async raiseRefundFailed(orderId, refundId, reason) {
        await this.create({
            alertType: client_1.FinanceAlertType.REFUND_FAILED,
            severity: client_1.FinanceAlertSeverity.CRITICAL,
            title: `Refund failed for order ${orderId}`,
            message: reason,
            metadata: { orderId, refundId },
        });
    }
    async raiseFraudAlert(input) {
        await this.create(input);
    }
    async checkNegativeMerchantBalances() {
        const wallets = await this.prisma.merchantWallet.findMany({
            where: { availableBalance: { lt: 0 } },
            include: { merchantProfile: { select: { businessName: true } } },
        });
        for (const w of wallets) {
            await this.create({
                alertType: client_1.FinanceAlertType.NEGATIVE_MERCHANT_BALANCE,
                severity: client_1.FinanceAlertSeverity.WARNING,
                title: `Negative balance: ${w.merchantProfile.businessName}`,
                message: `Available balance is ₹${Number(w.availableBalance)}`,
                metadata: { merchantProfileId: w.merchantProfileId },
            });
        }
        return wallets.length;
    }
    async checkCodMismatches() {
        const mismatches = await this.prisma.codReconciliation.count({
            where: { status: 'REJECTED', mismatchAmount: { gt: 0 } },
        });
        if (mismatches > 5) {
            await this.create({
                alertType: client_1.FinanceAlertType.COD_MISMATCH,
                severity: client_1.FinanceAlertSeverity.WARNING,
                title: 'COD reconciliation mismatches',
                message: `${mismatches} rejected COD remittances with mismatches`,
            });
        }
        return mismatches;
    }
    async listOpen(limit = 50) {
        return this.prisma.financeAlert.findMany({
            where: { status: client_1.FinanceAlertStatus.OPEN },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async create(input) {
        const recent = await this.prisma.financeAlert.findFirst({
            where: {
                alertType: input.alertType,
                status: client_1.FinanceAlertStatus.OPEN,
                title: input.title,
                createdAt: { gte: new Date(Date.now() - 3600000) },
            },
        });
        if (recent)
            return;
        await this.prisma.financeAlert.create({
            data: {
                alertType: input.alertType,
                severity: input.severity,
                title: input.title,
                message: input.message,
                metadata: input.metadata,
            },
        });
    }
};
exports.FinanceAlertService = FinanceAlertService;
exports.FinanceAlertService = FinanceAlertService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceAlertService);
//# sourceMappingURL=finance-alert.service.js.map