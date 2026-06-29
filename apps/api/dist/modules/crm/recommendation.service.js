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
exports.RecommendationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let RecommendationService = class RecommendationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRecommendations(userId, entityType, limit = 10) {
        const cached = await this.prisma.recommendationScore.findMany({
            where: { userId, entityType },
            orderBy: { score: 'desc' },
            take: limit,
        });
        if (cached.length >= limit)
            return cached;
        const affinities = await this.prisma.customerAffinity.findMany({
            where: { userId },
            orderBy: { score: 'desc' },
            take: 50,
        });
        const scores = [];
        for (const aff of affinities) {
            if (entityType === 'product' && aff.entityType === 'product') {
                scores.push({ entityType: 'product', entityId: aff.entityId, score: aff.score, reason: 'affinity' });
            }
            if (entityType === 'store' && aff.entityType === 'store') {
                scores.push({ entityType: 'store', entityId: aff.entityId, score: aff.score, reason: 'affinity' });
            }
        }
        if (entityType === 'product' && scores.length < limit) {
            const popular = await this.prisma.orderItem.groupBy({
                by: ['productId'],
                _count: true,
                orderBy: { _count: { productId: 'desc' } },
                take: limit,
            });
            for (const p of popular) {
                scores.push({ entityType: 'product', entityId: p.productId, score: p._count, reason: 'popular' });
            }
        }
        const unique = new Map();
        for (const s of scores) {
            const key = `${s.entityType}:${s.entityId}`;
            if (!unique.has(key) || unique.get(key).score < s.score)
                unique.set(key, s);
        }
        const result = [...unique.values()].sort((a, b) => b.score - a.score).slice(0, limit);
        for (const r of result) {
            await this.prisma.recommendationScore.upsert({
                where: {
                    userId_entityType_entityId: { userId, entityType: r.entityType, entityId: r.entityId },
                },
                create: { userId, entityType: r.entityType, entityId: r.entityId, score: r.score, reason: r.reason },
                update: { score: r.score, reason: r.reason },
            });
        }
        return result;
    }
};
exports.RecommendationService = RecommendationService;
exports.RecommendationService = RecommendationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecommendationService);
//# sourceMappingURL=recommendation.service.js.map