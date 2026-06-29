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
exports.AdminCampaignController = void 0;
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
const campaign_analytics_service_1 = require("./campaign-analytics.service");
const campaign_dto_1 = require("./dto/campaign.dto");
let AdminCampaignController = class AdminCampaignController {
    constructor(campaigns, analytics) {
        this.campaigns = campaigns;
        this.analytics = analytics;
    }
    async list(dto) {
        const result = await this.campaigns.listAdmin(dto);
        return {
            success: true,
            data: result.campaigns,
            meta: { page: result.page, limit: result.limit, total: result.total },
        };
    }
    async analyticsSummary() {
        const [summary, leaderboard, fraud] = await Promise.all([
            this.analytics.getPlatformSummary(),
            this.analytics.getLeaderboard(),
            this.analytics.getFraudSignals(),
        ]);
        return { success: true, data: { summary, leaderboard, fraud } };
    }
    async create(user, dto) {
        const data = await this.campaigns.createPlatformCampaign(user.id, dto);
        return { success: true, data };
    }
    async update(user, id, dto) {
        const data = await this.campaigns.updateCampaign(user.id, id, dto);
        return { success: true, data };
    }
    async pause(user, id) {
        const data = await this.campaigns.pauseCampaign(user.id, id);
        return { success: true, data };
    }
    async resume(user, id) {
        const data = await this.campaigns.resumeCampaign(user.id, id);
        return { success: true, data };
    }
};
exports.AdminCampaignController = AdminCampaignController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('coupons:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List platform and merchant campaigns' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [campaign_dto_1.ListCampaignsDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, permissions_decorator_1.Permissions)('coupons:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminCampaignController.prototype, "analyticsSummary", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, permissions_decorator_1.Permissions)('coupons:write'),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, campaign_dto_1.CreateCampaignDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('coupons:write'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, campaign_dto_1.UpdateCampaignDto]),
    __metadata("design:returntype", Promise)
], AdminCampaignController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/pause'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('coupons:write'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminCampaignController.prototype, "pause", null);
__decorate([
    (0, common_1.Post)(':id/resume'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('coupons:write'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminCampaignController.prototype, "resume", null);
exports.AdminCampaignController = AdminCampaignController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/campaigns'),
    __metadata("design:paramtypes", [campaign_service_1.CampaignService,
        campaign_analytics_service_1.CampaignAnalyticsService])
], AdminCampaignController);
//# sourceMappingURL=admin-campaign.controller.js.map