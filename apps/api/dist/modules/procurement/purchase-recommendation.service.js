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
var PurchaseRecommendationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseRecommendationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const order_status_groups_1 = require("../order/order-status-groups");
let PurchaseRecommendationService = PurchaseRecommendationService_1 = class PurchaseRecommendationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PurchaseRecommendationService_1.name);
    }
    async generateForMerchant(merchantProfileId, storeId) {
        const stores = storeId
            ? await this.prisma.store.findMany({ where: { id: storeId, merchantProfileId } })
            : await this.prisma.store.findMany({ where: { merchantProfileId, isActive: true, deletedAt: null } });
        const recommendations = [];
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        for (const store of stores) {
            const variants = await this.prisma.productVariant.findMany({
                where: { product: { storeId: store.id, isActive: true }, isActive: true },
                include: { inventory: true, product: { select: { name: true } } },
                take: 50,
            });
            for (const variant of variants) {
                const stock = variant.inventory?.availableQty ?? 0;
                const sales = await this.prisma.orderItem.aggregate({
                    where: {
                        variantId: variant.id,
                        order: {
                            storeId: store.id,
                            createdAt: { gte: fourteenDaysAgo },
                            status: { notIn: [...order_status_groups_1.BUYER_STATUS_GROUPS.cancelled] },
                        },
                    },
                    _sum: { quantity: true },
                });
                const totalSold = sales._sum.quantity ?? 0;
                const avgDaily = totalSold / 14;
                if (avgDaily < 0.5 && stock > 10)
                    continue;
                const predictedOos = avgDaily > 0 ? stock / avgDaily : 999;
                if (predictedOos > 7 && stock > 5)
                    continue;
                const alertType = this.resolveAlertType(stock, avgDaily, predictedOos);
                const recommendedQty = Math.max(variant.product ? 20 : 10, Math.ceil(avgDaily * 14));
                const vendorProduct = await this.prisma.vendorProduct.findFirst({
                    where: { sku: variant.sku, isActive: true, inventory: { availableQty: { gte: recommendedQty } } },
                    include: { vendor: { select: { id: true, businessName: true } } },
                    orderBy: { basePrice: 'asc' },
                });
                const unitPrice = Number(variant.price);
                const expectedImpact = recommendedQty * unitPrice * 0.3;
                const rec = await this.prisma.purchaseRecommendation.upsert({
                    where: {
                        id: `${merchantProfileId}-${store.id}-${variant.sku}`,
                    },
                    create: {
                        id: `${merchantProfileId}-${store.id}-${variant.sku}`,
                        merchantProfileId,
                        storeId: store.id,
                        vendorProductId: vendorProduct?.id,
                        sku: variant.sku,
                        productName: variant.product.name,
                        currentStock: stock,
                        avgDailySales: avgDaily,
                        predictedOosDays: predictedOos,
                        recommendedQty,
                        suggestedVendorId: vendorProduct?.vendor.id,
                        expectedRevenueImpact: expectedImpact,
                        alertType,
                    },
                    update: {
                        currentStock: stock,
                        avgDailySales: avgDaily,
                        predictedOosDays: predictedOos,
                        recommendedQty,
                        vendorProductId: vendorProduct?.id,
                        suggestedVendorId: vendorProduct?.vendor.id,
                        expectedRevenueImpact: expectedImpact,
                        alertType,
                        isDismissed: false,
                    },
                });
                recommendations.push({
                    ...rec,
                    suggestedVendorName: vendorProduct?.vendor.businessName,
                });
            }
        }
        return recommendations;
    }
    async listRecommendations(merchantProfileId, storeId) {
        await this.generateForMerchant(merchantProfileId, storeId);
        return this.prisma.purchaseRecommendation.findMany({
            where: { merchantProfileId, isDismissed: false, ...(storeId ? { storeId } : {}) },
            orderBy: { predictedOosDays: 'asc' },
            take: 20,
        });
    }
    resolveAlertType(stock, avgDaily, predictedOos) {
        if (stock === 0)
            return client_1.ProcurementAlertType.OUT_OF_STOCK_RISK;
        if (predictedOos <= 2)
            return client_1.ProcurementAlertType.LOW_STOCK_REPLENISH;
        if (avgDaily >= 5)
            return client_1.ProcurementAlertType.FAST_MOVING_SKU;
        if (avgDaily >= 3)
            return client_1.ProcurementAlertType.HIGH_DEMAND_ALERT;
        return client_1.ProcurementAlertType.SEASONAL_DEMAND_ALERT;
    }
};
exports.PurchaseRecommendationService = PurchaseRecommendationService;
exports.PurchaseRecommendationService = PurchaseRecommendationService = PurchaseRecommendationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchaseRecommendationService);
//# sourceMappingURL=purchase-recommendation.service.js.map