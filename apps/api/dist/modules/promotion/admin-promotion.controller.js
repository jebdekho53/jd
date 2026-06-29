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
exports.AdminPromotionController = void 0;
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
const store_promotion_service_1 = require("./store-promotion.service");
const promotion_dto_1 = require("./dto/promotion.dto");
let AdminPromotionController = class AdminPromotionController {
    constructor(service) {
        this.service = service;
    }
    async list(dto) {
        const result = await this.service.listAdmin(dto);
        return {
            success: true,
            data: { promotions: result.promotions, coupons: result.coupons },
            meta: { page: result.page, limit: result.limit, total: result.total },
        };
    }
    async analytics() {
        const data = await this.service.getPlatformAnalytics();
        return { success: true, data };
    }
    async createCampaign(user, dto) {
        const data = await this.service.createPlatformCoupon(user.id, dto);
        return { success: true, data };
    }
    async suspend(user, id) {
        const data = await this.service.suspendCoupon(user.id, id);
        return { success: true, data };
    }
};
exports.AdminPromotionController = AdminPromotionController;
__decorate([
    (0, common_1.Get)('promotions'),
    (0, permissions_decorator_1.Permissions)('coupons:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List all promotions and coupons' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [promotion_dto_1.ListAdminPromotionsDto]),
    __metadata("design:returntype", Promise)
], AdminPromotionController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('promotions/analytics'),
    (0, permissions_decorator_1.Permissions)('coupons:read'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminPromotionController.prototype, "analytics", null);
__decorate([
    (0, common_1.Post)('promotions/campaigns'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, permissions_decorator_1.Permissions)('coupons:write'),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, promotion_dto_1.CreateCouponDto]),
    __metadata("design:returntype", Promise)
], AdminPromotionController.prototype, "createCampaign", null);
__decorate([
    (0, common_1.Post)('promotions/coupons/:id/suspend'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('coupons:write'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminPromotionController.prototype, "suspend", null);
exports.AdminPromotionController = AdminPromotionController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [store_promotion_service_1.StorePromotionService])
], AdminPromotionController);
//# sourceMappingURL=admin-promotion.controller.js.map