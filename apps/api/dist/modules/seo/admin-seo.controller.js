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
exports.AdminSeoController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const prisma_service_1 = require("../../database/prisma.service");
const seo_analytics_service_1 = require("./seo-analytics.service");
const faq_engine_service_1 = require("./faq-engine.service");
const knowledge_graph_service_1 = require("./knowledge-graph.service");
const ai_crawler_analytics_service_1 = require("./ai-crawler-analytics.service");
let AdminSeoController = class AdminSeoController {
    constructor(prisma, analytics, faq, knowledge, crawlers) {
        this.prisma = prisma;
        this.analytics = analytics;
        this.faq = faq;
        this.knowledge = knowledge;
        this.crawlers = crawlers;
    }
    async overview() {
        const [seo, aeo, geo, technical] = await Promise.all([
            this.analytics.getAdminOverview(),
            this.faq.getAeoMetrics(),
            this.knowledge.getGeoMetrics(),
            this.crawlers.getCrawlHealth(),
        ]);
        return { success: true, data: { seo, aeo, geo, technical } };
    }
    async pages() {
        const data = await this.prisma.seoPage.findMany({
            where: { indexable: true },
            orderBy: { updatedAt: 'desc' },
            take: 100,
        });
        return { success: true, data };
    }
    async entities() {
        const data = await this.prisma.seoEntity.findMany({
            orderBy: { coverageScore: 'desc' },
            take: 100,
        });
        return { success: true, data };
    }
    async citations() {
        const data = await this.prisma.geoMention.findMany({
            orderBy: { detectedAt: 'desc' },
            take: 50,
        });
        return { success: true, data };
    }
    async keywords() {
        const data = await this.prisma.seoKeyword.findMany({
            orderBy: { impressions: 'desc' },
            take: 50,
        });
        return { success: true, data };
    }
};
exports.AdminSeoController = AdminSeoController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSeoController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('pages'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSeoController.prototype, "pages", null);
__decorate([
    (0, common_1.Get)('entities'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSeoController.prototype, "entities", null);
__decorate([
    (0, common_1.Get)('citations'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSeoController.prototype, "citations", null);
__decorate([
    (0, common_1.Get)('keywords'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSeoController.prototype, "keywords", null);
exports.AdminSeoController = AdminSeoController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/seo'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        seo_analytics_service_1.SeoAnalyticsService,
        faq_engine_service_1.FaqEngineService,
        knowledge_graph_service_1.KnowledgeGraphService,
        ai_crawler_analytics_service_1.AiCrawlerAnalyticsService])
], AdminSeoController);
//# sourceMappingURL=admin-seo.controller.js.map