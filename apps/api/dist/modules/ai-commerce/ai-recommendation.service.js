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
exports.AIRecommendationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let AIRecommendationService = class AIRecommendationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateForStore(storeId) {
        const forecasts = await this.prisma.demandForecast.findMany({
            where: { storeId },
            include: { product: { select: { name: true } } },
            orderBy: { predictedDemand: 'desc' },
            take: 5,
        });
        for (const f of forecasts) {
            if (f.predictedDemand < 5)
                continue;
            const title = `Increase ${f.product.name} stock`;
            const description = `Demand expected +${Math.round(f.confidenceScore * 0.4)}%`;
            await this.upsertRecommendation('PRODUCT', f.productId, title, description, 'HIGH');
        }
        const pricing = await this.prisma.pricingRecommendation.findMany({
            where: { storeId, status: 'PENDING' },
            include: { product: { select: { name: true } } },
            take: 3,
        });
        for (const p of pricing) {
            if (Number(p.recommendedPrice) < Number(p.currentPrice)) {
                await this.upsertRecommendation('PRODUCT', p.productId, `Launch offer on ${p.product.name}`, 'Competitor pricing lower — recommended discount', 'MEDIUM');
            }
        }
    }
    async generateAll() {
        const stores = await this.prisma.store.findMany({
            where: { isActive: true },
            select: { id: true },
            take: 50,
        });
        for (const s of stores)
            await this.generateForStore(s.id);
    }
    async getForMerchant(storeIds) {
        return this.prisma.aIRecommendation.findMany({
            where: {
                OR: storeIds.flatMap((id) => [
                    { entityType: 'STORE', entityId: id },
                    { entityType: 'MERCHANT', entityId: id },
                ]),
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            take: 30,
        });
    }
    async getAdminRecommendations() {
        return this.prisma.aIRecommendation.findMany({
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            take: 50,
        });
    }
    async upsertRecommendation(entityType, entityId, title, description, priority) {
        const existing = await this.prisma.aIRecommendation.findFirst({
            where: { entityType, entityId, title },
        });
        if (existing) {
            await this.prisma.aIRecommendation.update({
                where: { id: existing.id },
                data: { description, priority },
            });
        }
        else {
            await this.prisma.aIRecommendation.create({
                data: { entityType, entityId, title, description, priority },
            });
        }
    }
};
exports.AIRecommendationService = AIRecommendationService;
exports.AIRecommendationService = AIRecommendationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AIRecommendationService);
//# sourceMappingURL=ai-recommendation.service.js.map