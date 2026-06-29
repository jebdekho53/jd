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
exports.AdminOrderController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const order_service_1 = require("./order.service");
const list_orders_dto_1 = require("./dto/list-orders.dto");
let AdminOrderController = class AdminOrderController {
    constructor(orderService) {
        this.orderService = orderService;
    }
    async listOrders(dto) {
        const data = await this.orderService.listAdminOrders(dto);
        return { success: true, data };
    }
    async getOrder(orderId) {
        const data = await this.orderService.getAdminOrder(orderId);
        return { success: true, data };
    }
};
exports.AdminOrderController = AdminOrderController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'List all orders (admin monitoring)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated order list' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_orders_dto_1.ListAdminOrdersDto]),
    __metadata("design:returntype", Promise)
], AdminOrderController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)(':orderId'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get full order detail for admin' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminOrderController.prototype, "getOrder", null);
exports.AdminOrderController = AdminOrderController = __decorate([
    (0, swagger_1.ApiTags)('admin / orders'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/orders'),
    __metadata("design:paramtypes", [order_service_1.OrderService])
], AdminOrderController);
//# sourceMappingURL=admin-order.controller.js.map