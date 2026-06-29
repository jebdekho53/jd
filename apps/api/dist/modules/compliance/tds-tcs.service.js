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
exports.TdsTcsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const DEFAULT_TDS_RATE = 1;
const DEFAULT_TCS_RATE = 0.5;
let TdsTcsService = class TdsTcsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordMerchantTds(merchantProfileId, periodMonth, taxableAmount, tdsRate = DEFAULT_TDS_RATE) {
        const tdsAmount = round2(taxableAmount * (tdsRate / 100));
        const existing = await this.prisma.tdsRecord.findFirst({
            where: { merchantProfileId, periodMonth },
        });
        if (existing) {
            return this.prisma.tdsRecord.update({
                where: { id: existing.id },
                data: { taxableAmount, tdsRate, tdsAmount },
            });
        }
        return this.prisma.tdsRecord.create({
            data: { merchantProfileId, periodMonth, taxableAmount, tdsRate, tdsAmount },
        });
    }
    async recordPlatformTcs(periodMonth, gmvAmount, tcsRate = DEFAULT_TCS_RATE) {
        const tcsAmount = round2(gmvAmount * (tcsRate / 100));
        const existing = await this.prisma.tcsRecord.findFirst({ where: { periodMonth } });
        if (existing) {
            return this.prisma.tcsRecord.update({
                where: { id: existing.id },
                data: { gmvAmount, tcsRate, tcsAmount },
            });
        }
        return this.prisma.tcsRecord.create({
            data: { periodMonth, gmvAmount, tcsRate, tcsAmount },
        });
    }
    async merchantTdsSummary(merchantProfileId, periodMonth) {
        const where = { merchantProfileId };
        if (periodMonth)
            where.periodMonth = periodMonth;
        const records = await this.prisma.tdsRecord.findMany({
            where,
            orderBy: { periodMonth: 'desc' },
            take: 12,
        });
        return {
            records: records.map((r) => ({
                periodMonth: r.periodMonth,
                taxableAmount: Number(r.taxableAmount),
                tdsRate: Number(r.tdsRate),
                tdsAmount: Number(r.tdsAmount),
            })),
            totalTds: round2(records.reduce((s, r) => s + Number(r.tdsAmount), 0)),
        };
    }
    async platformTcsSummary(periodMonth) {
        const where = {};
        if (periodMonth)
            where.periodMonth = periodMonth;
        const records = await this.prisma.tcsRecord.findMany({
            where,
            orderBy: { periodMonth: 'desc' },
            take: 12,
        });
        return {
            records: records.map((r) => ({
                periodMonth: r.periodMonth,
                gmvAmount: Number(r.gmvAmount),
                tcsRate: Number(r.tcsRate),
                tcsAmount: Number(r.tcsAmount),
            })),
            totalTcs: round2(records.reduce((s, r) => s + Number(r.tcsAmount), 0)),
        };
    }
    async syncMonthlyFromInvoices(periodMonth) {
        const [year, month] = periodMonth.split('-').map(Number);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        const invoices = await this.prisma.gSTInvoice.findMany({
            where: { invoiceDate: { gte: start, lt: end } },
            select: {
                merchantProfileId: true,
                taxableAmount: true,
                grandTotal: true,
            },
        });
        const byMerchant = new Map();
        let platformGmv = 0;
        for (const inv of invoices) {
            byMerchant.set(inv.merchantProfileId, (byMerchant.get(inv.merchantProfileId) ?? 0) + Number(inv.taxableAmount));
            platformGmv += Number(inv.grandTotal);
        }
        for (const [merchantProfileId, taxable] of byMerchant) {
            await this.recordMerchantTds(merchantProfileId, periodMonth, taxable);
        }
        await this.recordPlatformTcs(periodMonth, platformGmv);
        return { merchants: byMerchant.size, platformGmv: round2(platformGmv) };
    }
};
exports.TdsTcsService = TdsTcsService;
exports.TdsTcsService = TdsTcsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TdsTcsService);
function round2(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=tds-tcs.service.js.map