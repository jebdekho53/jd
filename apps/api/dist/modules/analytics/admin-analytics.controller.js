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
exports.AdminAnalyticsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const analytics_service_1 = require("./analytics.service");
const analytics_query_dto_1 = require("./dto/analytics-query.dto");
let AdminAnalyticsController = class AdminAnalyticsController {
    constructor(analytics) {
        this.analytics = analytics;
    }
    getExecutive() {
        return this.analytics.getExecutive().then((data) => ({ success: true, data }));
    }
    getSales(query) {
        return this.analytics
            .getSales(query.granularity ?? 'daily', query.compare)
            .then((data) => ({ success: true, data }));
    }
    getOrders() {
        return this.analytics.getOrders().then((data) => ({ success: true, data }));
    }
    getCustomers() {
        return this.analytics.getCustomers().then((data) => ({ success: true, data }));
    }
    getMerchants() {
        return this.analytics.getMerchants().then((data) => ({ success: true, data }));
    }
    getRiders() {
        return this.analytics.getRiders().then((data) => ({ success: true, data }));
    }
    getGeo() {
        return this.analytics.getGeo().then((data) => ({ success: true, data }));
    }
    getInventory() {
        return this.analytics.getInventory().then((data) => ({ success: true, data }));
    }
    getWalletRewards() {
        return this.analytics.getWalletRewards().then((data) => ({ success: true, data }));
    }
    getFunnel() {
        return this.analytics.getFunnel().then((data) => ({ success: true, data }));
    }
    getAlerts() {
        return this.analytics.getAlerts().then((data) => ({ success: true, data }));
    }
    acknowledge(id) {
        return this.analytics.acknowledgeAlert(id).then((data) => ({ success: true, data }));
    }
    async export(query, res) {
        const result = await this.analytics.exportData(query.format ?? 'csv', query.range ?? '7d', query.type ?? 'executive', query.from, query.to);
        res.setHeader('Content-Type', result.mime);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.content);
    }
    getControlRoom() {
        return this.analytics.getControlRoom().then((data) => ({ success: true, data }));
    }
};
exports.AdminAnalyticsController = AdminAnalyticsController;
__decorate([
    (0, common_1.Get)('executive'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Executive BI dashboard KPIs (snapshot-backed)' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getExecutive", null);
__decorate([
    (0, common_1.Get)('sales'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.AnalyticsSalesQueryDto]),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getSales", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('customers'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getCustomers", null);
__decorate([
    (0, common_1.Get)('merchants'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getMerchants", null);
__decorate([
    (0, common_1.Get)('riders'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getRiders", null);
__decorate([
    (0, common_1.Get)('geo'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getGeo", null);
__decorate([
    (0, common_1.Get)('inventory'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Get)('wallet-rewards'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getWalletRewards", null);
__decorate([
    (0, common_1.Get)('funnel'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getFunnel", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Patch)('alerts/:id/acknowledge'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_query_dto_1.AnalyticsExportQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "export", null);
__decorate([
    (0, common_1.Get)('control-room'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminAnalyticsController.prototype, "getControlRoom", null);
exports.AdminAnalyticsController = AdminAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AdminAnalyticsController);
//# sourceMappingURL=admin-analytics.controller.js.map