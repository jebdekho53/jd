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
exports.ProcurementMarketplaceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let ProcurementMarketplaceService = class ProcurementMarketplaceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchVendors(query) {
        return this.prisma.vendor.findMany({
            where: {
                isActive: true,
                ...(query.vendorType ? { vendorType: query.vendorType } : {}),
                ...(query.q
                    ? { businessName: { contains: query.q, mode: client_1.Prisma.QueryMode.insensitive } }
                    : {}),
            },
            select: {
                id: true,
                businessName: true,
                vendorType: true,
                ratingAvg: true,
                ratingCount: true,
                gstNumber: true,
                city: { select: { name: true } },
                _count: { select: { products: true } },
            },
            orderBy: { ratingAvg: 'desc' },
            take: 30,
        });
    }
    async searchProducts(query) {
        return this.prisma.vendorProduct.findMany({
            where: {
                isActive: true,
                ...(query.q
                    ? {
                        OR: [
                            { name: { contains: query.q, mode: client_1.Prisma.QueryMode.insensitive } },
                            { sku: { contains: query.q, mode: client_1.Prisma.QueryMode.insensitive } },
                            { category: { contains: query.q, mode: client_1.Prisma.QueryMode.insensitive } },
                        ],
                    }
                    : {}),
                ...(query.moqMax ? { moq: { lte: query.moqMax } } : {}),
                ...(query.gstRate ? { gstRate: parseFloat(query.gstRate) } : {}),
            },
            include: {
                vendor: { select: { id: true, businessName: true, vendorType: true, ratingAvg: true } },
                inventory: { select: { availableQty: true } },
                priceTiers: { orderBy: { minQty: 'asc' }, take: 3 },
            },
            orderBy: { basePrice: 'asc' },
            take: 40,
        });
    }
    async getCreditLines(merchantProfileId) {
        const lines = await this.prisma.vendorCreditLine.findMany({
            where: { merchantProfileId, isActive: true },
            include: { vendor: { select: { businessName: true, vendorType: true } } },
        });
        return lines.map((l) => ({
            ...l,
            creditLimit: Number(l.creditLimit),
            usedLimit: Number(l.usedLimit),
            availableLimit: Number(l.creditLimit) - Number(l.usedLimit),
            overdueAmount: Number(l.overdueAmount),
        }));
    }
};
exports.ProcurementMarketplaceService = ProcurementMarketplaceService;
exports.ProcurementMarketplaceService = ProcurementMarketplaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProcurementMarketplaceService);
//# sourceMappingURL=procurement-marketplace.service.js.map