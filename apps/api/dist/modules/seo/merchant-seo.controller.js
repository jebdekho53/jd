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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantSeoController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const prisma_service_1 = require("../../database/prisma.service");
const seo_analytics_service_1 = require("./seo-analytics.service");
let MerchantSeoController = class MerchantSeoController {
    constructor(prisma, analytics) {
        this.prisma = prisma;
        this.analytics = analytics;
    }
    async primaryStoreId(userId) {
        const mp = await this.prisma.merchantProfile.findUnique({ where: { userId } });
        if (!mp)
            return null;
        const store = await this.prisma.store.findFirst({
            where: { merchantProfileId: mp.id, isActive: true },
            orderBy: { createdAt: 'asc' },
        });
        return store?.id ?? null;
    }
    async overview(user) {
        const storeId = await this.primaryStoreId(user.id);
        if (!storeId)
            return { success: true, data: {} };
        return { success: true, data: await this.analytics.getMerchantOverview(storeId) };
    }
    async recommendations(user) {
        const storeId = await this.primaryStoreId(user.id);
        if (!storeId)
            return { success: true, data: { recommendations: [] } };
        const overview = await this.analytics.getMerchantOverview(storeId);
        return { success: true, data: { recommendations: overview?.recommendations ?? [] } };
    }
};
exports.MerchantSeoController = MerchantSeoController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantSeoController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantSeoController.prototype, "recommendations", null);
exports.MerchantSeoController = MerchantSeoController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/seo'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        seo_analytics_service_1.SeoAnalyticsService])
], MerchantSeoController);
//# sourceMappingURL=merchant-seo.controller.js.map