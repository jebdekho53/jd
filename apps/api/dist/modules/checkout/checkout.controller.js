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
exports.CheckoutController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const checkout_service_1 = require("./checkout.service");
const initiate_checkout_dto_1 = require("./dto/initiate-checkout.dto");
let CheckoutController = class CheckoutController {
    constructor(checkoutService) {
        this.checkoutService = checkoutService;
    }
    async initiateCheckout(user, dto, ip) {
        const data = await this.checkoutService.initiateCheckout(user.id, dto, ip);
        return { success: true, data };
    }
    async initiateCodCheckout(user, dto, ip) {
        const data = await this.checkoutService.initiateCodCheckout(user.id, dto, ip);
        return { success: true, data };
    }
    async getCheckout(user, checkoutId) {
        const data = await this.checkoutService.getCheckout(user.id, checkoutId);
        return { success: true, data };
    }
};
exports.CheckoutController = CheckoutController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiHeader)({
        name: 'Idempotency-Key',
        description: 'UUID for idempotency protection. Required.',
        required: true,
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate checkout (online payment — Razorpay)',
        description: 'Reserves inventory for 15 minutes. Returns checkoutId — use it to create a ' +
            'Razorpay payment order at POST /payments/razorpay/create-order.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Checkout initiated and inventory reserved' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cart empty, product unavailable, or insufficient stock' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Duplicate idempotency key' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, initiate_checkout_dto_1.InitiateCheckoutDto, String]),
    __metadata("design:returntype", Promise)
], CheckoutController.prototype, "initiateCheckout", null);
__decorate([
    (0, common_1.Post)('cod'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiHeader)({
        name: 'Idempotency-Key',
        description: 'UUID for idempotency protection. Required.',
        required: true,
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate COD checkout — reserves stock and creates order immediately',
        description: 'No payment gateway. Order is created with MERCHANT_ACCEPTED status.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'COD order created' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, initiate_checkout_dto_1.InitiateCheckoutDto, String]),
    __metadata("design:returntype", Promise)
], CheckoutController.prototype, "initiateCodCheckout", null);
__decorate([
    (0, common_1.Get)(':checkoutId'),
    (0, swagger_1.ApiParam)({ name: 'checkoutId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get checkout status — includes expiry and linked orderId' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Checkout detail' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Checkout belongs to another buyer' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Checkout not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('checkoutId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CheckoutController.prototype, "getCheckout", null);
exports.CheckoutController = CheckoutController = __decorate([
    (0, swagger_1.ApiTags)('checkout'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer/checkout'),
    __metadata("design:paramtypes", [checkout_service_1.CheckoutService])
], CheckoutController);
//# sourceMappingURL=checkout.controller.js.map