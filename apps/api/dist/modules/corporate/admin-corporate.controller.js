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
exports.AdminCorporateAnalyticsController = exports.AdminCorporateController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const corporate_analytics_service_1 = require("./corporate-analytics.service");
const prisma_service_1 = require("../../database/prisma.service");
let AdminCorporateController = class AdminCorporateController {
    constructor(analytics, prisma) {
        this.analytics = analytics;
        this.prisma = prisma;
    }
    async overview() {
        const [metrics, companies] = await Promise.all([
            this.analytics.getAdminAnalytics(),
            this.prisma.corporateAccount.findMany({
                include: { wallet: true, _count: { select: { users: true } } },
                take: 50,
            }),
        ]);
        return { success: true, data: { metrics, companies } };
    }
};
exports.AdminCorporateController = AdminCorporateController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminCorporateController.prototype, "overview", null);
exports.AdminCorporateController = AdminCorporateController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/corporate'),
    __metadata("design:paramtypes", [corporate_analytics_service_1.CorporateAnalyticsService,
        prisma_service_1.PrismaService])
], AdminCorporateController);
let AdminCorporateAnalyticsController = class AdminCorporateAnalyticsController {
    constructor(analytics) {
        this.analytics = analytics;
    }
    async corporate() {
        return { success: true, data: await this.analytics.getAdminAnalytics() };
    }
};
exports.AdminCorporateAnalyticsController = AdminCorporateAnalyticsController;
__decorate([
    (0, common_1.Get)('corporate'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminCorporateAnalyticsController.prototype, "corporate", null);
exports.AdminCorporateAnalyticsController = AdminCorporateAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/analytics'),
    __metadata("design:paramtypes", [corporate_analytics_service_1.CorporateAnalyticsService])
], AdminCorporateAnalyticsController);
//# sourceMappingURL=admin-corporate.controller.js.map