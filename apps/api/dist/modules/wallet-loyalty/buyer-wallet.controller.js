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
exports.BuyerWalletController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const prisma_service_1 = require("../../database/prisma.service");
const wallet_service_1 = require("./wallet.service");
const reward_service_1 = require("./reward.service");
const referral_service_1 = require("./referral.service");
const wallet_loyalty_dto_1 = require("./dto/wallet-loyalty.dto");
let BuyerWalletController = class BuyerWalletController {
    constructor(prisma, wallet, reward, referral) {
        this.prisma = prisma;
        this.wallet = wallet;
        this.reward = reward;
        this.referral = referral;
    }
    async getWallet(user) {
        const bp = await this.requireBuyerProfile(user.id);
        const data = await this.wallet.getWalletSummary(bp.id);
        return { success: true, data };
    }
    async getRewards(user) {
        const bp = await this.requireBuyerProfile(user.id);
        const data = await this.reward.getRewardsSummary(bp.id);
        return { success: true, data };
    }
    async getReferrals(user) {
        const bp = await this.requireBuyerProfile(user.id);
        const data = await this.referral.getReferralSummary(bp.id);
        return { success: true, data };
    }
    async applyReferral(user, dto) {
        const bp = await this.requireBuyerProfile(user.id);
        const data = await this.referral.applyReferralCode(bp.id, dto.code, dto.deviceFingerprint);
        return { success: true, data };
    }
    async requireBuyerProfile(userId) {
        const bp = await this.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!bp)
            throw new common_1.NotFoundException('Buyer profile not found');
        return bp;
    }
};
exports.BuyerWalletController = BuyerWalletController;
__decorate([
    (0, common_1.Get)('wallet'),
    (0, swagger_1.ApiOperation)({ summary: 'Wallet balance and transactions' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyerWalletController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Get)('rewards'),
    (0, swagger_1.ApiOperation)({ summary: 'Reward points, tier and history' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyerWalletController.prototype, "getRewards", null);
__decorate([
    (0, common_1.Get)('referrals'),
    (0, swagger_1.ApiOperation)({ summary: 'Referral code and earnings' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuyerWalletController.prototype, "getReferrals", null);
__decorate([
    (0, common_1.Post)('referrals/apply'),
    (0, swagger_1.ApiOperation)({ summary: 'Apply a referral code' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, wallet_loyalty_dto_1.ApplyReferralDto]),
    __metadata("design:returntype", Promise)
], BuyerWalletController.prototype, "applyReferral", null);
exports.BuyerWalletController = BuyerWalletController = __decorate([
    (0, swagger_1.ApiTags)('buyer / wallet'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        reward_service_1.RewardService,
        referral_service_1.ReferralService])
], BuyerWalletController);
//# sourceMappingURL=buyer-wallet.controller.js.map