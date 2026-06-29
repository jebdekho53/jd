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
var InventoryForecastService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryForecastService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const inventory_forecast_util_1 = require("./inventory-forecast.util");
let InventoryForecastService = InventoryForecastService_1 = class InventoryForecastService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(InventoryForecastService_1.name);
    }
    async runForecastsForStore(storeId) {
        const products = await this.prisma.product.findMany({
            where: { storeId, isActive: true, deletedAt: null },
            include: {
                variants: {
                    include: { inventory: true },
                    where: { isDefault: true },
                    take: 1,
                },
            },
            take: 100,
        });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let count = 0;
        for (const product of products) {
            const inv = product.variants[0]?.inventory;
            const availableQty = inv?.availableQty ?? 0;
            const soldQty30d = inv?.soldQty ?? 0;
            const result = (0, inventory_forecast_util_1.predictStockout)({
                availableQty,
                soldQty30d,
                leadTimeDays: 2,
            });
            await this.prisma.inventoryForecast.upsert({
                where: { storeId_productId: { storeId, productId: product.id } },
                update: {
                    daysUntilStockout: result.daysUntilStockout,
                    recommendedQty: result.recommendedQty,
                    urgency: result.urgency,
                },
                create: {
                    storeId,
                    productId: product.id,
                    daysUntilStockout: result.daysUntilStockout,
                    recommendedQty: result.recommendedQty,
                    urgency: result.urgency,
                },
            });
            count++;
        }
        this.logger.log(`Generated ${count} inventory forecasts for store ${storeId}`);
        return count;
    }
    async runAllForecasts() {
        const stores = await this.prisma.store.findMany({
            where: { isActive: true, status: 'APPROVED' },
            select: { id: true },
            take: 50,
        });
        let total = 0;
        for (const s of stores)
            total += await this.runForecastsForStore(s.id);
        return total;
    }
    async getMerchantInventory(storeIds) {
        return this.prisma.inventoryForecast.findMany({
            where: { storeId: { in: storeIds } },
            include: { product: { select: { id: true, name: true } } },
            orderBy: [{ urgency: 'desc' }, { daysUntilStockout: 'asc' }],
            take: 50,
        });
    }
    async getInventoryCrises() {
        return this.prisma.inventoryForecast.findMany({
            where: { urgency: { in: ['HIGH', 'CRITICAL'] } },
            include: {
                store: { select: { name: true } },
                product: { select: { name: true } },
            },
            take: 30,
        });
    }
};
exports.InventoryForecastService = InventoryForecastService;
exports.InventoryForecastService = InventoryForecastService = InventoryForecastService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryForecastService);
//# sourceMappingURL=inventory-forecast.service.js.map