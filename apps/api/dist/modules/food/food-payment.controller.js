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
exports.FoodPaymentController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const food_payment_service_1 = require("./food-payment.service");
const verify_food_payment_dto_1 = require("./dto/verify-food-payment.dto");
let FoodPaymentController = class FoodPaymentController {
    constructor(payment) {
        this.payment = payment;
    }
    async createOrder(user, checkoutId, forwardedFor) {
        const ip = forwardedFor?.split(',')[0]?.trim();
        const data = await this.payment.createRazorpayOrder(user.id, checkoutId, ip);
        return { success: true, data };
    }
    async verify(user, dto, forwardedFor) {
        const ip = forwardedFor?.split(',')[0]?.trim();
        const data = await this.payment.verifyPayment(user.id, dto, ip);
        return { success: true, data };
    }
    async sync(user, checkoutId, forwardedFor) {
        const ip = forwardedFor?.split(',')[0]?.trim();
        const data = await this.payment.syncPayment(user.id, checkoutId, ip);
        return { success: true, data };
    }
};
exports.FoodPaymentController = FoodPaymentController;
__decorate([
    (0, common_1.Post)('create-order/:checkoutId'),
    (0, swagger_1.ApiOperation)({ summary: 'Create Razorpay order for pending food checkout (no merchant order yet)' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('checkoutId')),
    __param(2, (0, common_1.Headers)('x-forwarded-for')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], FoodPaymentController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify Razorpay payment and create food order' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-forwarded-for')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verify_food_payment_dto_1.VerifyFoodPaymentDto, String]),
    __metadata("design:returntype", Promise)
], FoodPaymentController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('sync/:checkoutId'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync captured Razorpay payment for food checkout' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('checkoutId')),
    __param(2, (0, common_1.Headers)('x-forwarded-for')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], FoodPaymentController.prototype, "sync", null);
exports.FoodPaymentController = FoodPaymentController = __decorate([
    (0, swagger_1.ApiTags)('food / checkout'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer/food-checkout/razorpay'),
    __metadata("design:paramtypes", [food_payment_service_1.FoodPaymentService])
], FoodPaymentController);
//# sourceMappingURL=food-payment.controller.js.map