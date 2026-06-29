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
exports.ProcurementAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let ProcurementAnalyticsService = class ProcurementAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMerchantAnalytics(merchantProfileId, storeId) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const orders = await this.prisma.vendorOrder.findMany({
            where: {
                merchantProfileId,
                createdAt: { gte: thirtyDaysAgo },
                ...(storeId ? { storeId } : {}),
            },
            include: { vendor: { select: { businessName: true } }, items: true },
        });
        const totalSpend = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
        const delivered = orders.filter((o) => o.status === client_1.VendorOrderStatus.DELIVERED).length;
        const byVendor = new Map();
        for (const o of orders) {
            const cur = byVendor.get(o.vendorId) ?? { name: o.vendor.businessName, spend: 0, orders: 0 };
            cur.spend += Number(o.totalAmount);
            cur.orders += 1;
            byVendor.set(o.vendorId, cur);
        }
        return {
            totalSpend,
            orderCount: orders.length,
            fulfillmentRate: orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0,
            vendorComparison: [...byVendor.values()].sort((a, b) => b.spend - a.spend).slice(0, 10),
            procurementSavings: Math.round(totalSpend * 0.08),
            inventoryTurnover: delivered > 0 ? Math.round(delivered / 30 * 10) / 10 : 0,
            marginAnalysis: { avgMarginPct: 22 },
        };
    }
};
exports.ProcurementAnalyticsService = ProcurementAnalyticsService;
exports.ProcurementAnalyticsService = ProcurementAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProcurementAnalyticsService);
//# sourceMappingURL=procurement-analytics.service.js.map