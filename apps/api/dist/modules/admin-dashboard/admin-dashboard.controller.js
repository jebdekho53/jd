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
exports.AdminDashboardController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const admin_dashboard_service_1 = require("./admin-dashboard.service");
const admin_dashboard_query_dto_1 = require("./dto/admin-dashboard-query.dto");
let AdminDashboardController = class AdminDashboardController {
    constructor(dashboard) {
        this.dashboard = dashboard;
    }
    getOverview() {
        return this.dashboard.getOverview().then((data) => ({ success: true, data }));
    }
    getOrders(query) {
        return this.dashboard.getOrders(query).then((data) => ({ success: true, data }));
    }
    getStores(query) {
        return this.dashboard.getStores(query).then((data) => ({ success: true, data }));
    }
    getRiders() {
        return this.dashboard.getRiders().then((data) => ({ success: true, data }));
    }
    getUnassigned() {
        return this.dashboard.getUnassignedOrders().then((data) => ({ success: true, data }));
    }
    getPayments() {
        return this.dashboard.getPayments().then((data) => ({ success: true, data }));
    }
    getCustomers() {
        return this.dashboard.getCustomers().then((data) => ({ success: true, data }));
    }
    getCategories() {
        return this.dashboard.getCategories().then((data) => ({ success: true, data }));
    }
    getFraudRisk() {
        return this.dashboard.getFraudRisk().then((data) => ({ success: true, data }));
    }
    getSystemHealth() {
        return this.dashboard.getSystemHealth().then((data) => ({ success: true, data }));
    }
};
exports.AdminDashboardController = AdminDashboardController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Platform health overview metrics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Live orders command center' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dashboard_query_dto_1.AdminDashboardOrdersQueryDto]),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('stores'),
    (0, permissions_decorator_1.Permissions)('stores:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Store governance summary' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dashboard_query_dto_1.AdminDashboardStoresQueryDto]),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getStores", null);
__decorate([
    (0, common_1.Get)('riders'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Rider control center' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getRiders", null);
__decorate([
    (0, common_1.Get)('unassigned-orders'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Orders waiting for rider assignment' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getUnassigned", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Payment monitoring' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Get)('customers'),
    (0, permissions_decorator_1.Permissions)('users:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Customer monitoring' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getCustomers", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, permissions_decorator_1.Permissions)('categories:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Category governance metrics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('fraud-risk'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Fraud and risk events' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getFraudRisk", null);
__decorate([
    (0, common_1.Get)('system-health'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Infrastructure health status' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminDashboardController.prototype, "getSystemHealth", null);
exports.AdminDashboardController = AdminDashboardController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/dashboard'),
    __metadata("design:paramtypes", [admin_dashboard_service_1.AdminDashboardService])
], AdminDashboardController);
//# sourceMappingURL=admin-dashboard.controller.js.map