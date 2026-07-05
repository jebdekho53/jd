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
exports.MerchantCampaignController = void 0;
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
const campaign_service_1 = require("./campaign.service");
const campaign_dto_1 = require("./dto/campaign.dto");
let MerchantCampaignController = class MerchantCampaignController {
    constructor(campaigns) {
        this.campaigns = campaigns;
    }
    async list(user, storeId, dto) {
        const result = await this.campaigns.listAdmin({ ...dto, storeId });
        return {
            success: true,
            data: result.campaigns,
            meta: { page: result.page, limit: result.limit, total: result.total },
        };
    }
    async create(user, storeId, dto) {
        const data = await this.campaigns.createMerchantCampaign(user.id, storeId, dto);
        return { success: true, data };
    }
    async performance(user, storeId, campaignId) {
        const data = await this.campaigns.merchantPerformance(user.id, storeId, campaignId);
        return { success: true, data };
    }
    async pause(user, storeId, campaignId) {
        const data = await this.campaigns.pauseCampaign(user.id, campaignId, storeId);
        return { success: true, data };
    }
    async resume(user, storeId, campaignId) {
        const data = await this.campaigns.resumeCampaign(user.id, campaignId, storeId);
        return { success: true, data };
    }
    async update(user, storeId, campaignId, dto) {
        const data = await this.campaigns.updateCampaign(user.id, campaignId, dto, storeId);
        return { success: true, data };
    }
    async addOffer(user, storeId, campaignId, dto) {
        const data = await this.campaigns.addOffer(user.id, storeId, campaignId, dto);
        return { success: true, data };
    }
};
exports.MerchantCampaignController = MerchantCampaignController;
__decorate([
    (0, common_1.Get)(':storeId/campaigns'),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, campaign_dto_1.ListCampaignsDto]),
    __metadata("design:returntype", Promise)
], MerchantCampaignController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':storeId/campaigns'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, campaign_dto_1.CreateCampaignDto]),
    __metadata("design:returntype", Promise)
], MerchantCampaignController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':storeId/campaigns/:campaignId/performance'),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantCampaignController.prototype, "performance", null);
__decorate([
    (0, common_1.Post)(':storeId/campaigns/:campaignId/pause'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantCampaignController.prototype, "pause", null);
__decorate([
    (0, common_1.Post)(':storeId/campaigns/:campaignId/resume'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantCampaignController.prototype, "resume", null);
__decorate([
    (0, common_1.Patch)(':storeId/campaigns/:campaignId'),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('campaignId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, campaign_dto_1.UpdateCampaignDto]),
    __metadata("design:returntype", Promise)
], MerchantCampaignController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':storeId/campaigns/:campaignId/offers'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('campaignId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, campaign_dto_1.CreateOfferDto]),
    __metadata("design:returntype", Promise)
], MerchantCampaignController.prototype, "addOffer", null);
exports.MerchantCampaignController = MerchantCampaignController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/stores'),
    __metadata("design:paramtypes", [campaign_service_1.CampaignService])
], MerchantCampaignController);
//# sourceMappingURL=merchant-campaign.controller.js.map