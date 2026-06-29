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
exports.MerchantAnalyticsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const analytics_service_1 = require("./analytics.service");
const analytics_query_dto_1 = require("./dto/analytics-query.dto");
const merchant_dashboard_service_1 = require("../merchant-dashboard/merchant-dashboard.service");
let MerchantAnalyticsController = class MerchantAnalyticsController {
    constructor(analytics, dashboard) {
        this.analytics = analytics;
        this.dashboard = dashboard;
    }
    async getSnapshot(user, query) {
        await this.dashboard.resolveStoreContext(user.id, query.storeId);
        const data = await this.analytics.getMerchantSnapshot(query.storeId, query.period ?? '7d');
        return { success: true, data };
    }
    async getStore(user, storeId, query) {
        await this.dashboard.resolveStoreContext(user.id, storeId);
        const data = await this.analytics.getMerchantSnapshot(storeId, query.period ?? '7d');
        return { success: true, data };
    }
};
exports.MerchantAnalyticsController = MerchantAnalyticsController;
__decorate([
    (0, common_1.Get)('snapshot'),
    (0, swagger_1.ApiOperation)({ summary: 'Store analytics from daily snapshots' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, analytics_query_dto_1.MerchantAnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantAnalyticsController.prototype, "getSnapshot", null);
__decorate([
    (0, common_1.Get)('store/:storeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Merchant analytics dashboard rollup' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, analytics_query_dto_1.MerchantAnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], MerchantAnalyticsController.prototype, "getStore", null);
exports.MerchantAnalyticsController = MerchantAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService,
        merchant_dashboard_service_1.MerchantDashboardService])
], MerchantAnalyticsController);
//# sourceMappingURL=merchant-analytics.controller.js.map