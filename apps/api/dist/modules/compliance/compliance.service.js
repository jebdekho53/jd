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
exports.ComplianceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const compliance_cache_service_1 = require("./compliance-cache.service");
const tds_tcs_service_1 = require("./tds-tcs.service");
let ComplianceService = class ComplianceService {
    constructor(prisma, cache, tdsTcs) {
        this.prisma = prisma;
        this.cache = cache;
        this.tdsTcs = tdsTcs;
    }
    async getOverview() {
        const cached = await this.cache.get('admin:overview');
        if (cached)
            return cached;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [invoiceAgg, creditCount, debitCount, tcs] = await Promise.all([
            this.prisma.gSTInvoice.aggregate({
                where: { invoiceDate: { gte: monthStart } },
                _sum: { totalTax: true, taxableAmount: true, grandTotal: true },
                _count: true,
            }),
            this.prisma.creditNote.count({ where: { issuedAt: { gte: monthStart } } }),
            this.prisma.debitNote.count({ where: { issuedAt: { gte: monthStart } } }),
            this.tdsTcs.platformTcsSummary(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`),
        ]);
        const data = {
            monthToDate: {
                invoices: invoiceAgg._count,
                taxableSales: Number(invoiceAgg._sum.taxableAmount ?? 0),
                gstCollected: Number(invoiceAgg._sum.totalTax ?? 0),
                gmv: Number(invoiceAgg._sum.grandTotal ?? 0),
                creditNotes: creditCount,
                debitNotes: debitCount,
                platformTcs: tcs.totalTcs,
            },
        };
        void this.cache.set('admin:overview', data, 120);
        return data;
    }
    async listInvoices(page = 1, limit = 20, month) {
        const where = {};
        if (month) {
            const [y, m] = month.split('-').map(Number);
            where.invoiceDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
        }
        const [items, total] = await Promise.all([
            this.prisma.gSTInvoice.findMany({
                where,
                orderBy: { invoiceDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { store: { select: { name: true } } },
            }),
            this.prisma.gSTInvoice.count({ where }),
        ]);
        return {
            items: items.map((i) => this.mapInvoice(i)),
            total,
            page,
            limit,
        };
    }
    async listCreditNotes(page = 1, limit = 20) {
        const [items, total] = await Promise.all([
            this.prisma.creditNote.findMany({
                orderBy: { issuedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { invoice: { select: { invoiceNumber: true } } },
            }),
            this.prisma.creditNote.count(),
        ]);
        return { items, total, page, limit };
    }
    async listDebitNotes(page = 1, limit = 20) {
        const [items, total] = await Promise.all([
            this.prisma.debitNote.findMany({
                orderBy: { issuedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { merchantProfile: { select: { businessName: true } } },
            }),
            this.prisma.debitNote.count(),
        ]);
        return { items, total, page, limit };
    }
    async getInvoiceDetail(invoiceId) {
        const invoice = await this.prisma.gSTInvoice.findUnique({
            where: { id: invoiceId },
            include: { lines: true, store: { select: { name: true } }, order: { select: { orderNumber: true } } },
        });
        if (!invoice)
            return null;
        return this.mapInvoice(invoice);
    }
    async merchantGstDashboard(merchantProfileId, month) {
        const where = { merchantProfileId };
        if (month) {
            const [y, m] = month.split('-').map(Number);
            where.invoiceDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
        }
        const agg = await this.prisma.gSTInvoice.aggregate({
            where,
            _sum: { taxableAmount: true, totalTax: true, grandTotal: true },
            _count: true,
        });
        const recent = await this.prisma.gSTInvoice.findMany({
            where: { merchantProfileId },
            orderBy: { invoiceDate: 'desc' },
            take: 10,
            include: { order: { select: { orderNumber: true } } },
        });
        const tds = await this.tdsTcs.merchantTdsSummary(merchantProfileId, month);
        return {
            summary: {
                invoiceCount: agg._count,
                taxableSales: Number(agg._sum.taxableAmount ?? 0),
                gstCollected: Number(agg._sum.totalTax ?? 0),
                grossTotal: Number(agg._sum.grandTotal ?? 0),
            },
            recentInvoices: recent.map((i) => ({
                id: i.id,
                invoiceNumber: i.invoiceNumber,
                orderNumber: i.order.orderNumber,
                grandTotal: Number(i.grandTotal),
                invoiceDate: i.invoiceDate,
            })),
            tds,
        };
    }
    async buyerInvoiceForOrder(orderId, buyerProfileId) {
        const invoice = await this.prisma.gSTInvoice.findFirst({
            where: { orderId, buyerProfileId },
            include: { lines: true, order: { select: { orderNumber: true, status: true } } },
        });
        if (!invoice)
            return null;
        return {
            ...this.mapInvoice(invoice),
            orderNumber: invoice.order.orderNumber,
            orderStatus: invoice.order.status,
            lines: invoice.lines,
        };
    }
    mapInvoice(i) {
        return {
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            orderId: i.orderId,
            orderNumber: i.order?.orderNumber,
            storeName: i.store?.name,
            status: i.status,
            supplyType: i.supplyType,
            supplierGstin: i.supplierGstin,
            taxableAmount: Number(i.taxableAmount),
            cgstAmount: Number(i.cgstAmount),
            sgstAmount: Number(i.sgstAmount),
            igstAmount: Number(i.igstAmount),
            totalTax: Number(i.totalTax),
            grandTotal: Number(i.grandTotal),
            deliveryFee: Number(i.deliveryFee),
            invoiceDate: i.invoiceDate,
            emailedAt: i.emailedAt,
            isImmutable: i.isImmutable,
        };
    }
};
exports.ComplianceService = ComplianceService;
exports.ComplianceService = ComplianceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        compliance_cache_service_1.ComplianceCacheService,
        tds_tcs_service_1.TdsTcsService])
], ComplianceService);
//# sourceMappingURL=compliance.service.js.map