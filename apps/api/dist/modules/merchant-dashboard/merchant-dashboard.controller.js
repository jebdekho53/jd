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
exports.MerchantDashboardController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const merchant_dashboard_service_1 = require("./merchant-dashboard.service");
const merchant_dashboard_query_dto_1 = require("./dto/merchant-dashboard-query.dto");
let MerchantDashboardController = class MerchantDashboardController {
    constructor(dashboard) {
        this.dashboard = dashboard;
    }
    getOverview(user, query) {
        return this.dashboard.getOverview(user.id, query).then((data) => ({ success: true, data }));
    }
    getOrders(user, query) {
        return this.dashboard.getOrders(user.id, query).then((data) => ({ success: true, data }));
    }
    getInventory(user, query) {
        return this.dashboard.getInventory(user.id, query).then((data) => ({ success: true, data }));
    }
    getRiders(user, query) {
        return this.dashboard.getRiders(user.id, query).then((data) => ({ success: true, data }));
    }
    getAnalytics(user, query) {
        return this.dashboard.getAnalytics(user.id, query).then((data) => ({ success: true, data }));
    }
    getCustomers(user, query) {
        return this.dashboard.getCustomers(user.id, query).then((data) => ({ success: true, data }));
    }
    getCompliance(user, query) {
        return this.dashboard.getCompliance(user.id, query).then((data) => ({ success: true, data }));
    }
    getNotifications(user, query) {
        return this.dashboard.getNotifications(user.id, query).then((data) => ({ success: true, data }));
    }
};
exports.MerchantDashboardController = MerchantDashboardController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Business health overview — today vs yesterday' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_dashboard_query_dto_1.MerchantDashboardStoreQueryDto]),
    __metadata("design:returntype", void 0)
], MerchantDashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Live order queue with status tabs' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_dashboard_query_dto_1.MerchantDashboardOrdersQueryDto]),
    __metadata("design:returntype", void 0)
], MerchantDashboardController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('inventory'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Inventory health and low-stock alerts' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_dashboard_query_dto_1.MerchantDashboardStoreQueryDto]),
    __metadata("design:returntype", void 0)
], MerchantDashboardController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Get)('riders'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Assigned riders and active deliveries' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_dashboard_query_dto_1.MerchantDashboardStoreQueryDto]),
    __metadata("design:returntype", void 0)
], MerchantDashboardController.prototype, "getRiders", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Revenue, category, and hourly demand analytics' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_dashboard_query_dto_1.MerchantDashboardAnalyticsQueryDto]),
    __metadata("design:returntype", void 0)
], MerchantDashboardController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('customers'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Customer insights and recent reviews' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_dashboard_query_dto_1.MerchantDashboardStoreQueryDto]),
    __metadata("design:returntype", void 0)
], MerchantDashboardController.prototype, "getCustomers", null);
__decorate([
    (0, common_1.Get)('compliance'),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Store compliance and category approval status' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_dashboard_query_dto_1.MerchantDashboardStoreQueryDto]),
    __metadata("design:returntype", void 0)
], MerchantDashboardController.prototype, "getCompliance", null);
__decorate([
    (0, common_1.Get)('notifications'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Recent alerts — orders, inventory, compliance' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_dashboard_query_dto_1.MerchantDashboardStoreQueryDto]),
    __metadata("design:returntype", void 0)
], MerchantDashboardController.prototype, "getNotifications", null);
exports.MerchantDashboardController = MerchantDashboardController = __decorate([
    (0, swagger_1.ApiTags)('merchant / dashboard'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/dashboard'),
    __metadata("design:paramtypes", [merchant_dashboard_service_1.MerchantDashboardService])
], MerchantDashboardController);
//# sourceMappingURL=merchant-dashboard.controller.js.map