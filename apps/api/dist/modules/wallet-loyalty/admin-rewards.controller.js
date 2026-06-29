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
exports.AdminRewardsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const prisma_service_1 = require("../../database/prisma.service");
const fraud_service_1 = require("./fraud.service");
const reward_config_service_1 = require("./reward-config.service");
const reward_service_1 = require("./reward.service");
const wallet_service_1 = require("./wallet.service");
const wallet_loyalty_dto_1 = require("./dto/wallet-loyalty.dto");
let AdminRewardsController = class AdminRewardsController {
    constructor(prisma, config, wallet, reward, fraud) {
        this.prisma = prisma;
        this.config = config;
        this.wallet = wallet;
        this.reward = reward;
        this.fraud = fraud;
    }
    async getConfig() {
        const data = await this.config.getRules();
        return { success: true, data };
    }
    async updateConfig(user, key, dto) {
        const data = await this.config.updateConfig(key, dto.value, user.id);
        return { success: true, data };
    }
    async analytics() {
        const [walletAgg, pointsAgg, referralCount, buyers] = await Promise.all([
            this.prisma.buyerWallet.aggregate({ _sum: { balance: true }, _count: true }),
            this.prisma.buyerWallet.aggregate({ _sum: { rewardPoints: true } }),
            this.prisma.referral.count({ where: { status: 'COMPLETED' } }),
            this.prisma.buyerProfile.count(),
        ]);
        const repeatBuyers = await this.prisma.order.groupBy({
            by: ['buyerProfileId'],
            where: { status: { in: ['DELIVERED', 'COMPLETED'] } },
            _count: { id: true },
            having: { id: { _count: { gt: 1 } } },
        });
        const topLoyal = await this.prisma.buyerWallet.findMany({
            orderBy: { lifetimePoints: 'desc' },
            take: 10,
            include: { buyerProfile: { select: { name: true } } },
        });
        return {
            success: true,
            data: {
                walletLiability: Number(walletAgg._sum.balance ?? 0),
                walletHolders: walletAgg._count,
                rewardPointsLiability: pointsAgg._sum.rewardPoints ?? 0,
                completedReferrals: referralCount,
                totalBuyers: buyers,
                repeatPurchaseRate: buyers > 0 ? Math.round((repeatBuyers.length / buyers) * 100) : 0,
                topLoyalCustomers: topLoyal.map((w) => ({
                    name: w.buyerProfile.name,
                    tier: w.tier,
                    lifetimePoints: w.lifetimePoints,
                    balance: Number(w.balance),
                })),
            },
        };
    }
    async fraudReviews() {
        const data = await this.fraud.listPendingReviews();
        return { success: true, data };
    }
    async resolveFraud(user, id, dto) {
        const data = await this.fraud.resolveReview(id, user.id, dto.approve);
        return { success: true, data };
    }
    async creditWallet(user, walletId, dto) {
        if (dto.amount <= 0)
            throw new common_1.BadRequestException('Amount must be positive');
        await this.prisma.$transaction(async (tx) => {
            await this.wallet.creditWallet(tx, walletId, dto.amount, client_1.WalletTransactionType.ADMIN_ADJUSTMENT, {
                description: dto.reason,
                createdBy: user.id,
                idempotencyKey: `admin-credit:${walletId}:${Date.now()}`,
            });
        });
        return { success: true, data: { credited: dto.amount } };
    }
    async debitWallet(user, walletId, dto) {
        if (dto.amount <= 0)
            throw new common_1.BadRequestException('Amount must be positive');
        await this.prisma.$transaction(async (tx) => {
            await this.wallet.debitWallet(tx, walletId, dto.amount, {
                description: dto.reason,
                idempotencyKey: `admin-debit:${walletId}:${Date.now()}`,
            });
        });
        return { success: true, data: { debited: dto.amount } };
    }
    async adjustPoints(user, walletId, dto) {
        const data = await this.reward.adminAdjustPoints(walletId, dto.points, user.id, dto.reason);
        return { success: true, data };
    }
};
exports.AdminRewardsController = AdminRewardsController;
__decorate([
    (0, common_1.Get)('config'),
    (0, swagger_1.ApiOperation)({ summary: 'Reward program configuration' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminRewardsController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Patch)('config/:key'),
    (0, swagger_1.ApiOperation)({ summary: 'Update reward program rule' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('key')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, wallet_loyalty_dto_1.UpdateRewardConfigDto]),
    __metadata("design:returntype", Promise)
], AdminRewardsController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Wallet and loyalty liabilities analytics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminRewardsController.prototype, "analytics", null);
__decorate([
    (0, common_1.Get)('fraud-reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Pending fraud review queue' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminRewardsController.prototype, "fraudReviews", null);
__decorate([
    (0, common_1.Patch)('fraud-reviews/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve fraud review' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, wallet_loyalty_dto_1.ResolveFraudReviewDto]),
    __metadata("design:returntype", Promise)
], AdminRewardsController.prototype, "resolveFraud", null);
__decorate([
    (0, common_1.Post)('wallets/:walletId/credit'),
    (0, swagger_1.ApiOperation)({ summary: 'Manual wallet credit' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('walletId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, wallet_loyalty_dto_1.AdminAdjustWalletDto]),
    __metadata("design:returntype", Promise)
], AdminRewardsController.prototype, "creditWallet", null);
__decorate([
    (0, common_1.Post)('wallets/:walletId/debit'),
    (0, swagger_1.ApiOperation)({ summary: 'Manual wallet debit' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('walletId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, wallet_loyalty_dto_1.AdminAdjustWalletDto]),
    __metadata("design:returntype", Promise)
], AdminRewardsController.prototype, "debitWallet", null);
__decorate([
    (0, common_1.Post)('wallets/:walletId/points'),
    (0, swagger_1.ApiOperation)({ summary: 'Manual points adjustment' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('walletId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, wallet_loyalty_dto_1.AdminAdjustPointsDto]),
    __metadata("design:returntype", Promise)
], AdminRewardsController.prototype, "adjustPoints", null);
exports.AdminRewardsController = AdminRewardsController = __decorate([
    (0, swagger_1.ApiTags)('admin / rewards'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin/rewards'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        reward_config_service_1.RewardConfigService,
        wallet_service_1.WalletService,
        reward_service_1.RewardService,
        fraud_service_1.FraudService])
], AdminRewardsController);
//# sourceMappingURL=admin-rewards.controller.js.map