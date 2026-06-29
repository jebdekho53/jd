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
exports.BuyerOrderController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const order_service_1 = require("./order.service");
const list_orders_dto_1 = require("./dto/list-orders.dto");
const cancel_order_dto_1 = require("./dto/cancel-order.dto");
let BuyerOrderController = class BuyerOrderController {
    constructor(orderService) {
        this.orderService = orderService;
    }
    async listOrders(user, dto) {
        const data = await this.orderService.listBuyerOrders(user.id, dto);
        return { success: true, data };
    }
    async getOrder(user, orderId) {
        const data = await this.orderService.getBuyerOrder(user.id, orderId);
        return { success: true, data };
    }
    async cancelOrder(user, orderId, dto, ip) {
        const data = await this.orderService.cancelByBuyer(user.id, orderId, dto, ip);
        return { success: true, data };
    }
};
exports.BuyerOrderController = BuyerOrderController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List buyer order history (paginated, filterable by status)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated order list' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_orders_dto_1.ListOrdersDto]),
    __metadata("design:returntype", Promise)
], BuyerOrderController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)(':orderId'),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get buyer order detail including timeline and items' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order detail with timeline' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Order not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuyerOrderController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Post)(':orderId/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancel order (buyer) — only allowed before merchant confirms',
        description: 'Paid Razorpay orders will have a refund automatically initiated.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order cancelled' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Order cannot be cancelled in current status' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, cancel_order_dto_1.CancelOrderDto, String]),
    __metadata("design:returntype", Promise)
], BuyerOrderController.prototype, "cancelOrder", null);
exports.BuyerOrderController = BuyerOrderController = __decorate([
    (0, swagger_1.ApiTags)('buyer / orders'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer/orders'),
    __metadata("design:paramtypes", [order_service_1.OrderService])
], BuyerOrderController);
//# sourceMappingURL=buyer-order.controller.js.map