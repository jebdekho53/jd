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
exports.MerchantAiWalletController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const merchant_service_1 = require("../merchant/merchant.service");
const merchant_ai_wallet_service_1 = require("./merchant-ai-wallet.service");
const merchant_ai_wallet_dto_1 = require("./dto/merchant-ai-wallet.dto");
let MerchantAiWalletController = class MerchantAiWalletController {
    constructor(wallet, merchantService) {
        this.wallet = wallet;
        this.merchantService = merchantService;
    }
    async getWallet(user, page, limit) {
        const profile = await this.merchantService.requireMerchantProfile(user.id);
        const data = await this.wallet.getWalletSummary(profile.id, page ? Number(page) : 1, limit ? Number(limit) : 50);
        return { success: true, data };
    }
    async createRechargeOrder(user, dto, ip) {
        const profile = await this.merchantService.requireMerchantProfile(user.id);
        const data = await this.wallet.createRechargeOrder(profile.id, dto.amountPaise, user.id, ip);
        return { success: true, data };
    }
    async verifyRecharge(user, dto, ip) {
        const profile = await this.merchantService.requireMerchantProfile(user.id);
        const data = await this.wallet.verifyRecharge(profile.id, dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature, user.id, ip);
        return { success: true, data };
    }
};
exports.MerchantAiWalletController = MerchantAiWalletController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('products:read'),
    (0, swagger_1.ApiOperation)({ summary: 'AI wallet balance and transaction history' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantAiWalletController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Post)('recharge/create-order'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Create Razorpay order for AI wallet recharge' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_ai_wallet_dto_1.CreateAiWalletRechargeDto, String]),
    __metadata("design:returntype", Promise)
], MerchantAiWalletController.prototype, "createRechargeOrder", null);
__decorate([
    (0, common_1.Post)('recharge/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify Razorpay payment and credit AI wallet' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_ai_wallet_dto_1.VerifyAiWalletRechargeDto, String]),
    __metadata("design:returntype", Promise)
], MerchantAiWalletController.prototype, "verifyRecharge", null);
exports.MerchantAiWalletController = MerchantAiWalletController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/ai-wallet'),
    __metadata("design:paramtypes", [merchant_ai_wallet_service_1.MerchantAiWalletService,
        merchant_service_1.MerchantService])
], MerchantAiWalletController);
//# sourceMappingURL=merchant-ai-wallet.controller.js.map