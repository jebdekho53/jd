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
exports.AdminSupplyChainService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let AdminSupplyChainService = class AdminSupplyChainService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard() {
        const [vendors, orders, settlements, shortages] = await Promise.all([
            this.prisma.vendor.count({ where: { isActive: true } }),
            this.prisma.vendorOrder.count({
                where: { status: { in: [client_1.VendorOrderStatus.PENDING, client_1.VendorOrderStatus.CONFIRMED, client_1.VendorOrderStatus.SHIPPED] } },
            }),
            this.prisma.vendorSettlement.count({ where: { status: client_1.VendorSettlementStatus.PENDING } }),
            this.prisma.purchaseRecommendation.count({ where: { isDismissed: false, predictedOosDays: { lte: 3 } } }),
        ]);
        const topVendors = await this.prisma.vendor.findMany({
            where: { isActive: true },
            orderBy: { ratingAvg: 'desc' },
            take: 5,
            select: { id: true, businessName: true, vendorType: true, ratingAvg: true, ratingCount: true },
        });
        const creditRisk = await this.prisma.vendorCreditLine.findMany({
            where: { overdueAmount: { gt: 0 } },
            include: {
                vendor: { select: { businessName: true } },
                merchantProfile: { select: { businessName: true } },
            },
            take: 10,
        });
        return {
            activeVendors: vendors,
            activeOrders: orders,
            pendingSettlements: settlements,
            inventoryShortages: shortages,
            topVendors,
            creditRisk,
        };
    }
    async listVendors() {
        return this.prisma.vendor.findMany({
            include: { _count: { select: { products: true, orders: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async listVendorOrders() {
        return this.prisma.vendorOrder.findMany({
            include: {
                vendor: { select: { businessName: true } },
                merchantProfile: { select: { businessName: true } },
                shipment: true,
                invoice: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async listVendorSettlements() {
        return this.prisma.vendorSettlement.findMany({
            include: { vendor: { select: { businessName: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
};
exports.AdminSupplyChainService = AdminSupplyChainService;
exports.AdminSupplyChainService = AdminSupplyChainService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminSupplyChainService);
//# sourceMappingURL=admin-supply-chain.service.js.map