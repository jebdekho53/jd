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
exports.FinanceExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const settlement_utils_1 = require("../settlement/settlement.utils");
let FinanceExportService = class FinanceExportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportSettlementsCsv(merchantProfileId) {
        const rows = await this.prisma.settlement.findMany({
            where: merchantProfileId ? { merchantProfileId } : {},
            orderBy: { createdAt: 'desc' },
            take: 500,
            include: { merchantProfile: { select: { businessName: true } } },
        });
        const header = 'id,merchant,cycle,status,gross,commission,net,items,period_start,period_end\n';
        const lines = rows.map((r) => `${r.id},${escapeCsv(r.merchantProfile.businessName)},${r.cycle},${r.status},${(0, settlement_utils_1.decimalToNumber)(r.grossAmount)},${(0, settlement_utils_1.decimalToNumber)(r.commissionAmount)},${(0, settlement_utils_1.decimalToNumber)(r.netAmount)},${r.itemCount},${r.periodStart.toISOString()},${r.periodEnd.toISOString()}`);
        return header + lines.join('\n');
    }
    async exportTaxReport(periodMonth) {
        const records = await this.prisma.taxRecord.findMany({
            where: { periodMonth },
            orderBy: { createdAt: 'desc' },
            take: 1000,
        });
        const header = 'order_id,tax_type,taxable_amount,tax_amount,gst_rate,period\n';
        const lines = records.map((r) => `${r.orderId ?? ''},${r.taxType},${(0, settlement_utils_1.decimalToNumber)(r.taxableAmount)},${(0, settlement_utils_1.decimalToNumber)(r.taxAmount)},${r.gstRate ? (0, settlement_utils_1.decimalToNumber)(r.gstRate) : ''},${r.periodMonth ?? ''}`);
        return header + lines.join('\n');
    }
    async exportMerchantPayoutsCsv() {
        const rows = await this.prisma.merchantPayout.findMany({
            orderBy: { createdAt: 'desc' },
            take: 500,
            include: { merchantProfile: { select: { businessName: true } } },
        });
        const header = 'id,merchant,amount,status,reference,processed_at\n';
        const lines = rows.map((r) => `${r.id},${escapeCsv(r.merchantProfile.businessName)},${(0, settlement_utils_1.decimalToNumber)(r.amount)},${r.status},${r.referenceId ?? ''},${r.processedAt?.toISOString() ?? ''}`);
        return header + lines.join('\n');
    }
    async exportRevenueSummary() {
        const [orders, snapshots] = await Promise.all([
            this.prisma.order.aggregate({
                where: { status: { in: ['DELIVERED', 'COMPLETED'] } },
                _sum: { totalAmount: true, discountAmount: true, deliveryFee: true },
                _count: { id: true },
            }),
            this.prisma.orderFinancialSnapshot.aggregate({
                _sum: {
                    commissionAmount: true,
                    netPlatformEarnings: true,
                    netMerchantEarnings: true,
                },
            }),
        ]);
        return {
            orderCount: orders._count.id,
            gmv: (0, settlement_utils_1.decimalToNumber)(orders._sum.totalAmount),
            discounts: (0, settlement_utils_1.decimalToNumber)(orders._sum.discountAmount),
            deliveryFees: (0, settlement_utils_1.decimalToNumber)(orders._sum.deliveryFee),
            platformCommission: (0, settlement_utils_1.decimalToNumber)(snapshots._sum.commissionAmount),
            platformEarnings: (0, settlement_utils_1.decimalToNumber)(snapshots._sum.netPlatformEarnings),
            merchantEarnings: (0, settlement_utils_1.decimalToNumber)(snapshots._sum.netMerchantEarnings),
        };
    }
};
exports.FinanceExportService = FinanceExportService;
exports.FinanceExportService = FinanceExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceExportService);
function escapeCsv(value) {
    if (value.includes(',') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
//# sourceMappingURL=finance-export.service.js.map