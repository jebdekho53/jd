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
var DynamicPricingAIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicPricingAIService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let DynamicPricingAIService = DynamicPricingAIService_1 = class DynamicPricingAIService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DynamicPricingAIService_1.name);
    }
    async runRecommendationsForStore(storeId) {
        const products = await this.prisma.product.findMany({
            where: { storeId, isActive: true, deletedAt: null },
            select: { id: true, basePrice: true, name: true },
            take: 50,
        });
        let count = 0;
        for (const product of products) {
            const currentPrice = Number(product.basePrice);
            const forecast = await this.prisma.demandForecast.findFirst({
                where: { storeId, productId: product.id },
                orderBy: { forecastDate: 'asc' },
            });
            const demandTrend = forecast ? forecast.predictedDemand / Math.max(1, forecast.actualDemand ?? forecast.predictedDemand) : 1;
            let recommendedPrice = currentPrice;
            let expectedLiftPercent = 0;
            if (demandTrend > 1.2) {
                recommendedPrice = round(currentPrice * 1.05);
                expectedLiftPercent = -2;
            }
            else if (demandTrend < 0.8) {
                recommendedPrice = round(currentPrice * 0.92);
                expectedLiftPercent = 12;
            }
            if (recommendedPrice === currentPrice)
                continue;
            const existing = await this.prisma.pricingRecommendation.findFirst({
                where: { storeId, productId: product.id, status: 'PENDING' },
            });
            if (existing) {
                await this.prisma.pricingRecommendation.update({
                    where: { id: existing.id },
                    data: { currentPrice, recommendedPrice, expectedLiftPercent },
                });
            }
            else {
                await this.prisma.pricingRecommendation.create({
                    data: {
                        storeId,
                        productId: product.id,
                        currentPrice,
                        recommendedPrice,
                        expectedLiftPercent,
                    },
                });
            }
            count++;
        }
        this.logger.log(`Generated ${count} pricing recommendations for store ${storeId}`);
        return count;
    }
    async runAllRecommendations() {
        const stores = await this.prisma.store.findMany({
            where: { isActive: true, status: 'APPROVED' },
            select: { id: true },
            take: 50,
        });
        let total = 0;
        for (const s of stores)
            total += await this.runRecommendationsForStore(s.id);
        return total;
    }
    async getMerchantPricing(storeIds) {
        return this.prisma.pricingRecommendation.findMany({
            where: { storeId: { in: storeIds }, status: 'PENDING' },
            include: { product: { select: { id: true, name: true } } },
            take: 30,
        });
    }
};
exports.DynamicPricingAIService = DynamicPricingAIService;
exports.DynamicPricingAIService = DynamicPricingAIService = DynamicPricingAIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DynamicPricingAIService);
function round(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=dynamic-pricing-ai.service.js.map