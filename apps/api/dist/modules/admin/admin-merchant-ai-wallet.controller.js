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
exports.AdminMerchantAiWalletController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const merchant_ai_wallet_service_1 = require("../product/merchant-ai-wallet.service");
const merchant_ai_wallet_dto_1 = require("../product/dto/merchant-ai-wallet.dto");
let AdminMerchantAiWalletController = class AdminMerchantAiWalletController {
    constructor(wallet) {
        this.wallet = wallet;
    }
    async list(page, limit) {
        const data = await this.wallet.listWalletsForAdmin(page ? Number(page) : 1, limit ? Number(limit) : 50);
        return { success: true, data };
    }
    async stats() {
        const data = await this.wallet.getWalletStatsForAdmin();
        return { success: true, data };
    }
    async detail(merchantId) {
        const data = await this.wallet.getWalletForAdmin(merchantId);
        return { success: true, data };
    }
    async adjust(user, merchantId, dto, ip) {
        const data = await this.wallet.adminAdjust(merchantId, dto.amountPaise, dto.reason, user.id, ip);
        return { success: true, data };
    }
};
exports.AdminMerchantAiWalletController = AdminMerchantAiWalletController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List merchant AI wallets' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminMerchantAiWalletController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Aggregate AI wallet statistics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminMerchantAiWalletController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)(':merchantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Merchant AI wallet detail' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('merchantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminMerchantAiWalletController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(':merchantId/adjust'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Manual AI wallet balance adjustment' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('merchantId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, merchant_ai_wallet_dto_1.AdminAdjustAiWalletDto, String]),
    __metadata("design:returntype", Promise)
], AdminMerchantAiWalletController.prototype, "adjust", null);
exports.AdminMerchantAiWalletController = AdminMerchantAiWalletController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin/merchant-ai-wallets'),
    __metadata("design:paramtypes", [merchant_ai_wallet_service_1.MerchantAiWalletService])
], AdminMerchantAiWalletController);
//# sourceMappingURL=admin-merchant-ai-wallet.controller.js.map