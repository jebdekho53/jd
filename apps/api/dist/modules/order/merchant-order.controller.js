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
exports.MerchantOrderController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const order_service_1 = require("./order.service");
const list_orders_dto_1 = require("./dto/list-orders.dto");
const cancel_order_dto_1 = require("./dto/cancel-order.dto");
const mark_issue_dto_1 = require("./dto/mark-issue.dto");
let MerchantOrderController = class MerchantOrderController {
    constructor(orderService) {
        this.orderService = orderService;
    }
    async listOrders(user, dto) {
        const data = await this.orderService.listMerchantOrders(user.id, dto);
        return { success: true, data };
    }
    async getOrder(user, orderId) {
        const data = await this.orderService.getMerchantOrder(user.id, orderId);
        return { success: true, data };
    }
    async confirmOrder(user, orderId, ip) {
        const data = await this.orderService.advanceMerchantOrder(user.id, orderId, client_1.OrderStatus.MERCHANT_ACCEPTED, undefined, ip);
        return { success: true, data };
    }
    async markPreparing(user, orderId, ip) {
        const data = await this.orderService.advanceMerchantOrder(user.id, orderId, client_1.OrderStatus.PREPARING, undefined, ip);
        return { success: true, data };
    }
    async markPacking(user, orderId, ip) {
        const data = await this.orderService.advanceMerchantOrder(user.id, orderId, client_1.OrderStatus.PACKING, undefined, ip);
        return { success: true, data };
    }
    async markReady(user, orderId, ip) {
        const data = await this.orderService.advanceMerchantOrder(user.id, orderId, client_1.OrderStatus.READY_FOR_PICKUP, undefined, ip);
        return { success: true, data };
    }
    async cancelOrder(user, orderId, dto, ip) {
        const data = await this.orderService.cancelByMerchant(user.id, orderId, dto, ip);
        return { success: true, data };
    }
    async markIssue(user, orderId, dto, ip) {
        const data = await this.orderService.markOrderIssue(user.id, orderId, dto.note, ip);
        return { success: true, data };
    }
};
exports.MerchantOrderController = MerchantOrderController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Merchant order queue — paginated, filterable by status / store',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order queue with pagination' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_orders_dto_1.ListMerchantOrdersDto]),
    __metadata("design:returntype", Promise)
], MerchantOrderController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)(':orderId'),
    (0, permissions_decorator_1.Permissions)('orders:read'),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get merchant order detail including buyer info and timeline' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order detail' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Order does not belong to merchant store' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantOrderController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Patch)(':orderId/confirm'),
    (0, permissions_decorator_1.Permissions)('orders:update_status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Confirm order (PAID → MERCHANT_ACCEPTED)',
        description: 'Transitions a paid order to confirmed. For COD orders already start at MERCHANT_ACCEPTED — use /preparing directly.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order confirmed' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid status transition' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantOrderController.prototype, "confirmOrder", null);
__decorate([
    (0, common_1.Patch)(':orderId/preparing'),
    (0, permissions_decorator_1.Permissions)('orders:update_status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Mark order as preparing (MERCHANT_ACCEPTED → PREPARING)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order now PREPARING' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantOrderController.prototype, "markPreparing", null);
__decorate([
    (0, common_1.Patch)(':orderId/packing'),
    (0, permissions_decorator_1.Permissions)('orders:update_status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Start packing (PREPARING → PACKING)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantOrderController.prototype, "markPacking", null);
__decorate([
    (0, common_1.Patch)(':orderId/ready'),
    (0, permissions_decorator_1.Permissions)('orders:update_status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Mark ready for pickup (PACKING → READY_FOR_PICKUP, auto-assign rider)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order now READY_FOR_PICKUP' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantOrderController.prototype, "markReady", null);
__decorate([
    (0, common_1.Patch)(':orderId/cancel'),
    (0, permissions_decorator_1.Permissions)('orders:update_status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancel order (merchant) — allowed before READY_FOR_PICKUP',
        description: 'Paid Razorpay orders will have a refund automatically initiated.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order cancelled by merchant' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Order cannot be cancelled in current status' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, cancel_order_dto_1.CancelOrderDto, String]),
    __metadata("design:returntype", Promise)
], MerchantOrderController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Patch)(':orderId/issue'),
    (0, permissions_decorator_1.Permissions)('orders:update_status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Flag an operational issue without changing order status' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, mark_issue_dto_1.MarkOrderIssueDto, String]),
    __metadata("design:returntype", Promise)
], MerchantOrderController.prototype, "markIssue", null);
exports.MerchantOrderController = MerchantOrderController = __decorate([
    (0, swagger_1.ApiTags)('merchant / orders'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/orders'),
    __metadata("design:paramtypes", [order_service_1.OrderService])
], MerchantOrderController);
//# sourceMappingURL=merchant-order.controller.js.map