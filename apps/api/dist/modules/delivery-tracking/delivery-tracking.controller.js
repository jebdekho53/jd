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
exports.AdminTrackingController = exports.MerchantTrackingController = exports.BuyerTrackingController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const delivery_tracking_service_1 = require("./delivery-tracking.service");
let BuyerTrackingController = class BuyerTrackingController {
    constructor(tracking) {
        this.tracking = tracking;
    }
    async getTracking(user, orderId) {
        const data = await this.tracking.getBuyerTracking(user.id, orderId);
        return { success: true, data };
    }
};
exports.BuyerTrackingController = BuyerTrackingController;
__decorate([
    (0, common_1.Get)(':orderId/tracking'),
    (0, swagger_1.ApiOperation)({ summary: 'Live delivery tracking for buyer' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuyerTrackingController.prototype, "getTracking", null);
exports.BuyerTrackingController = BuyerTrackingController = __decorate([
    (0, swagger_1.ApiTags)('buyer / tracking'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer/orders'),
    __metadata("design:paramtypes", [delivery_tracking_service_1.DeliveryTrackingService])
], BuyerTrackingController);
let MerchantTrackingController = class MerchantTrackingController {
    constructor(tracking) {
        this.tracking = tracking;
    }
    async getTracking(user, orderId) {
        const data = await this.tracking.getMerchantTracking(user.id, orderId);
        return { success: true, data };
    }
};
exports.MerchantTrackingController = MerchantTrackingController;
__decorate([
    (0, common_1.Get)(':orderId/tracking'),
    (0, swagger_1.ApiOperation)({ summary: 'Live delivery tracking for merchant' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantTrackingController.prototype, "getTracking", null);
exports.MerchantTrackingController = MerchantTrackingController = __decorate([
    (0, swagger_1.ApiTags)('merchant / tracking'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/orders'),
    __metadata("design:paramtypes", [delivery_tracking_service_1.DeliveryTrackingService])
], MerchantTrackingController);
let AdminTrackingController = class AdminTrackingController {
    constructor(tracking) {
        this.tracking = tracking;
    }
    async getOrderTracking(orderId) {
        const data = await this.tracking.getAdminTracking(orderId);
        return { success: true, data };
    }
    async getFleetLive(status) {
        const data = await this.tracking.getFleetLive(status);
        return { success: true, data };
    }
    async getAnalytics() {
        const data = await this.tracking.getAnalytics();
        return { success: true, data };
    }
};
exports.AdminTrackingController = AdminTrackingController;
__decorate([
    (0, common_1.Get)('orders/:orderId/tracking'),
    (0, swagger_1.ApiOperation)({ summary: 'Live delivery tracking for admin' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminTrackingController.prototype, "getOrderTracking", null);
__decorate([
    (0, common_1.Get)('fleet/live'),
    (0, swagger_1.ApiOperation)({ summary: 'Live fleet monitoring' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminTrackingController.prototype, "getFleetLive", null);
__decorate([
    (0, common_1.Get)('fleet/analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Delivery tracking analytics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminTrackingController.prototype, "getAnalytics", null);
exports.AdminTrackingController = AdminTrackingController = __decorate([
    (0, swagger_1.ApiTags)('admin / tracking'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [delivery_tracking_service_1.DeliveryTrackingService])
], AdminTrackingController);
//# sourceMappingURL=delivery-tracking.controller.js.map