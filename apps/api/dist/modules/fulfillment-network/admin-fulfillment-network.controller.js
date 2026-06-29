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
exports.AdminFulfillmentNetworkController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const admin_fulfillment_network_service_1 = require("./admin-fulfillment-network.service");
let AdminFulfillmentNetworkController = class AdminFulfillmentNetworkController {
    constructor(admin) {
        this.admin = admin;
    }
    async dashboard() {
        return { success: true, data: await this.admin.getDashboard() };
    }
    async transfers() {
        return { success: true, data: await this.admin.listTransfers() };
    }
    async capacity() {
        return { success: true, data: await this.admin.getCapacityHeatmap() };
    }
    async sla() {
        return { success: true, data: await this.admin.getSlaMetrics() };
    }
};
exports.AdminFulfillmentNetworkController = AdminFulfillmentNetworkController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFulfillmentNetworkController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('transfers'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFulfillmentNetworkController.prototype, "transfers", null);
__decorate([
    (0, common_1.Get)('capacity'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFulfillmentNetworkController.prototype, "capacity", null);
__decorate([
    (0, common_1.Get)('sla'),
    (0, permissions_decorator_1.Permissions)('settlements:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFulfillmentNetworkController.prototype, "sla", null);
exports.AdminFulfillmentNetworkController = AdminFulfillmentNetworkController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/fulfillment-network'),
    __metadata("design:paramtypes", [admin_fulfillment_network_service_1.AdminFulfillmentNetworkService])
], AdminFulfillmentNetworkController);
//# sourceMappingURL=admin-fulfillment-network.controller.js.map