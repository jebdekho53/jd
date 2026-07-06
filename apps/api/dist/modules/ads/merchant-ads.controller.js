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
exports.MerchantAdsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const prisma_service_1 = require("../../database/prisma.service");
const ad_analytics_service_1 = require("./ad-analytics.service");
const client_1 = require("@prisma/client");
let MerchantAdsController = class MerchantAdsController {
    constructor(prisma, adAnalytics) {
        this.prisma = prisma;
        this.adAnalytics = adAnalytics;
    }
    async advertiserId(userId) {
        const mp = await this.prisma.merchantProfile.findUnique({ where: { userId } });
        return mp?.id;
    }
    async campaigns(user) {
        const advertiserId = await this.advertiserId(user.id);
        if (!advertiserId)
            return { success: true, data: [] };
        const data = await this.prisma.adCampaign.findMany({
            where: { advertiserId },
            include: { sponsoredProducts: true, keywordBids: true },
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, data };
    }
    async createCampaign(user, body) {
        const advertiserId = await this.advertiserId(user.id);
        if (!advertiserId)
            return { success: false, message: 'Merchant profile required' };
        const campaign = await this.prisma.adCampaign.create({
            data: {
                name: body.name,
                advertiserId,
                budget: body.budget,
                status: client_1.AdCampaignStatus.DRAFT,
                adGroups: { create: { bidAmount: 10, dailyBudget: body.budget / 30 } },
                sponsoredProducts: body.productIds?.length
                    ? { create: body.productIds.map((productId, i) => ({ productId, priority: body.productIds.length - i })) }
                    : undefined,
                keywordBids: body.keywords?.length
                    ? { create: body.keywords.map((k) => ({ keyword: k.keyword, bidAmount: k.bidAmount })) }
                    : undefined,
            },
        });
        return { success: true, data: campaign };
    }
    async analytics(user) {
        const advertiserId = await this.advertiserId(user.id);
        if (!advertiserId)
            return { success: true, data: {} };
        return { success: true, data: await this.adAnalytics.getMerchantAnalytics(advertiserId) };
    }
};
exports.MerchantAdsController = MerchantAdsController;
__decorate([
    (0, common_1.Get)('campaigns'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantAdsController.prototype, "campaigns", null);
__decorate([
    (0, common_1.Post)('campaigns'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MerchantAdsController.prototype, "createCampaign", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, permissions_decorator_1.Permissions)('analytics:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantAdsController.prototype, "analytics", null);
exports.MerchantAdsController = MerchantAdsController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/ads'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ad_analytics_service_1.AdAnalyticsService])
], MerchantAdsController);
//# sourceMappingURL=merchant-ads.controller.js.map