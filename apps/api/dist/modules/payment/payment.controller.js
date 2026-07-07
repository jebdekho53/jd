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
exports.PaymentController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const idempotency_interceptor_1 = require("../../common/interceptors/idempotency.interceptor");
const payment_service_1 = require("./payment.service");
const create_razorpay_order_dto_1 = require("./dto/create-razorpay-order.dto");
const verify_payment_dto_1 = require("./dto/verify-payment.dto");
const sync_razorpay_payment_dto_1 = require("./dto/sync-razorpay-payment.dto");
let PaymentController = class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async createRazorpayOrder(user, dto, ip) {
        const data = await this.paymentService.createRazorpayOrder(user.id, dto, ip);
        return { success: true, data };
    }
    async verifyPayment(user, dto, ip) {
        const data = await this.paymentService.verifyPayment(user.id, dto, ip);
        return { success: true, data };
    }
    async syncPayment(user, dto, ip) {
        const data = await this.paymentService.syncCheckoutPayment(user.id, dto.checkoutId, ip);
        return { success: true, data };
    }
    async handleWebhook(req, signature) {
        const rawBody = req.rawBody;
        if (!rawBody) {
            throw new common_1.BadRequestException('Missing request body');
        }
        if (!signature) {
            throw new common_1.UnauthorizedException('Missing webhook signature');
        }
        await this.paymentService.handleWebhook(rawBody, signature);
        return { success: true };
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('razorpay/create-order'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.UseInterceptors)(idempotency_interceptor_1.IdempotencyInterceptor),
    (0, swagger_1.ApiHeader)({ name: 'Idempotency-Key', required: false }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Razorpay order details for an existing checkout',
        description: 'Idempotent — re-calling with the same checkoutId returns the same Razorpay order.',
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_razorpay_order_dto_1.CreateRazorpayOrderDto, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createRazorpayOrder", null);
__decorate([
    (0, common_1.Post)('razorpay/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.UseInterceptors)(idempotency_interceptor_1.IdempotencyInterceptor),
    (0, swagger_1.ApiHeader)({ name: 'Idempotency-Key', required: false }),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify Razorpay payment signature and confirm order',
        description: 'Verifies HMAC-SHA256 signature, consumes inventory reservations, and advances ' +
            'order to CREATED status. Idempotent — repeat calls return the original response.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment verified, order confirmed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Signature verification failed' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verify_payment_dto_1.VerifyPaymentDto, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('razorpay/sync'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.UseInterceptors)(idempotency_interceptor_1.IdempotencyInterceptor),
    (0, swagger_1.ApiHeader)({ name: 'Idempotency-Key', required: false }),
    (0, swagger_1.ApiOperation)({
        summary: 'Sync Razorpay payment status from server',
        description: 'When client-side verify fails but Razorpay captured the payment, reconcile and mark the order paid.',
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, sync_razorpay_payment_dto_1.SyncRazorpayPaymentDto, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "syncPayment", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Razorpay webhook endpoint',
        description: 'Verifies X-Razorpay-Signature before processing. Handles payment.captured and ' +
            'payment.failed events.',
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-razorpay-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleWebhook", null);
exports.PaymentController = PaymentController = __decorate([
    (0, swagger_1.ApiTags)('payments'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map