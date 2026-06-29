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
exports.AiCrawlerAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ai_crawler_util_1 = require("./ai-crawler.util");
let AiCrawlerAnalyticsService = class AiCrawlerAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordVisit(input) {
        const crawlerType = (0, ai_crawler_util_1.detectCrawlerType)(input.userAgent);
        if (!crawlerType)
            return null;
        const entity = (0, ai_crawler_util_1.parseEntityFromPath)(input.path);
        return this.prisma.aiCrawlerVisit.create({
            data: {
                crawlerUserAgent: input.userAgent ?? 'unknown',
                crawlerType,
                path: input.path,
                ipAddress: input.ipAddress,
                indexedEntityType: entity?.type,
                indexedEntityId: entity?.id,
            },
        });
    }
    async getMetrics(sinceDays = 30) {
        const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
        const [byType, topPaths, total] = await Promise.all([
            this.prisma.aiCrawlerVisit.groupBy({
                by: ['crawlerType'],
                where: { createdAt: { gte: since } },
                _count: { id: true },
            }),
            this.prisma.aiCrawlerVisit.groupBy({
                by: ['path'],
                where: { createdAt: { gte: since } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 20,
            }),
            this.prisma.aiCrawlerVisit.count({ where: { createdAt: { gte: since } } }),
        ]);
        const indexedEntities = await this.prisma.aiCrawlerVisit.groupBy({
            by: ['indexedEntityType'],
            where: { createdAt: { gte: since }, indexedEntityType: { not: null } },
            _count: { id: true },
        });
        return { total, byType, topPaths, indexedEntities };
    }
    async getCrawlHealth() {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recent = await this.prisma.aiCrawlerVisit.count({ where: { createdAt: { gte: last24h } } });
        const aiTypes = [
            client_1.AiCrawlerType.CHATGPT,
            client_1.AiCrawlerType.GEMINI,
            client_1.AiCrawlerType.PERPLEXITY,
            client_1.AiCrawlerType.CLAUDE,
            client_1.AiCrawlerType.BING_AI,
        ];
        const activeEngines = await this.prisma.aiCrawlerVisit.groupBy({
            by: ['crawlerType'],
            where: { createdAt: { gte: last24h }, crawlerType: { in: aiTypes } },
            _count: { id: true },
        });
        return {
            visitsLast24h: recent,
            activeAiEngines: activeEngines.length,
            health: recent > 0 ? 'healthy' : 'idle',
        };
    }
};
exports.AiCrawlerAnalyticsService = AiCrawlerAnalyticsService;
exports.AiCrawlerAnalyticsService = AiCrawlerAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiCrawlerAnalyticsService);
//# sourceMappingURL=ai-crawler-analytics.service.js.map