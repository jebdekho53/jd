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
exports.AdminAdsAnalyticsController = exports.AdminAdsController = void 0;
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
const ad_analytics_service_1 = require("./ad-analytics.service");
let AdminAdsController = class AdminAdsController {
    constructor(prisma, analytics) {
        this.prisma = prisma;
        this.analytics = analytics;
    }
    async overview() {
        const [metrics, topAdvertisers, campaigns] = await Promise.all([
            this.analytics.getAdminAnalytics(),
            this.prisma.adCampaign.groupBy({
                by: ['advertiserId'],
                _sum: { spentAmount: true },
                orderBy: { _sum: { spentAmount: 'desc' } },
                take: 10,
            }),
            this.prisma.adCampaign.findMany({
                where: { status: 'ACTIVE' },
                take: 20,
                include: { advertiser: { select: { businessName: true } } },
            }),
        ]);
        return { success: true, data: { metrics, topAdvertisers, campaigns } };
    }
};
exports.AdminAdsController = AdminAdsController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAdsController.prototype, "overview", null);
exports.AdminAdsController = AdminAdsController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/ads'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ad_analytics_service_1.AdAnalyticsService])
], AdminAdsController);
let AdminAdsAnalyticsController = class AdminAdsAnalyticsController {
    constructor(analytics) {
        this.analytics = analytics;
    }
    async ads() {
        return { success: true, data: await this.analytics.getAdminAnalytics() };
    }
};
exports.AdminAdsAnalyticsController = AdminAdsAnalyticsController;
__decorate([
    (0, common_1.Get)('ads'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAdsAnalyticsController.prototype, "ads", null);
exports.AdminAdsAnalyticsController = AdminAdsAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/analytics'),
    __metadata("design:paramtypes", [ad_analytics_service_1.AdAnalyticsService])
], AdminAdsAnalyticsController);
//# sourceMappingURL=admin-ads.controller.js.map