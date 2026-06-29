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
exports.MerchantLoyaltyController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const prisma_service_1 = require("../../database/prisma.service");
let MerchantLoyaltyController = class MerchantLoyaltyController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async loyaltyAnalytics(user, storeId) {
        await this.assertStoreOwned(user.id, storeId);
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const orders = await this.prisma.order.findMany({
            where: {
                storeId,
                createdAt: { gte: since },
                status: { in: ['DELIVERED', 'COMPLETED'] },
            },
            select: {
                buyerProfileId: true,
                totalAmount: true,
                walletAmountUsed: true,
                rewardPointsUsed: true,
                rewardPointsEarned: true,
                buyerProfile: { include: { wallet: { select: { tier: true, rewardPoints: true } } } },
            },
        });
        const buyerMap = new Map();
        for (const o of orders) {
            const cur = buyerMap.get(o.buyerProfileId) ?? {
                orders: 0,
                revenue: 0,
                tier: o.buyerProfile.wallet?.tier ?? null,
            };
            cur.orders += 1;
            cur.revenue += Number(o.totalAmount);
            buyerMap.set(o.buyerProfileId, cur);
        }
        const repeatCustomers = [...buyerMap.values()].filter((b) => b.orders > 1).length;
        const loyaltyMembers = [...buyerMap.values()].filter((b) => b.tier && b.tier !== 'BRONZE').length;
        const walletRedemptions = orders.filter((o) => Number(o.walletAmountUsed) > 0).length;
        const pointsRedemptions = orders.filter((o) => o.rewardPointsUsed > 0).length;
        const loyaltyRevenue = orders
            .filter((o) => o.buyerProfile.wallet && o.buyerProfile.wallet.tier !== 'BRONZE')
            .reduce((s, o) => s + Number(o.totalAmount), 0);
        return {
            success: true,
            data: {
                storeId,
                totalOrders: orders.length,
                uniqueCustomers: buyerMap.size,
                repeatCustomers,
                loyaltyMembers,
                walletRedemptions,
                pointsRedemptions,
                revenueFromLoyaltyUsers: Math.round(loyaltyRevenue * 100) / 100,
                totalRevenue: orders.reduce((s, o) => s + Number(o.totalAmount), 0),
            },
        };
    }
    async assertStoreOwned(userId, storeId) {
        const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.ForbiddenException('Merchant profile not found');
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
        });
        if (!store)
            throw new common_1.ForbiddenException('Store not found');
    }
};
exports.MerchantLoyaltyController = MerchantLoyaltyController;
__decorate([
    (0, common_1.Get)(':storeId/loyalty-analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Loyalty and repeat customer insights' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantLoyaltyController.prototype, "loyaltyAnalytics", null);
exports.MerchantLoyaltyController = MerchantLoyaltyController = __decorate([
    (0, swagger_1.ApiTags)('merchant / loyalty'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/stores'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MerchantLoyaltyController);
//# sourceMappingURL=merchant-loyalty.controller.js.map