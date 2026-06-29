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
exports.AdminMerchantController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const constants_1 = require("../../common/constants");
const admin_merchant_service_1 = require("./admin-merchant.service");
const remove_blacklist_dto_1 = require("./dto/remove-blacklist.dto");
let AdminMerchantController = class AdminMerchantController {
    constructor(adminMerchantService) {
        this.adminMerchantService = adminMerchantService;
    }
    async removeBlacklist(user, merchantProfileId, dto, ip, req) {
        const data = await this.adminMerchantService.removeBlacklist(user.id, merchantProfileId, dto, ip, req.headers['user-agent']);
        return { success: true, data };
    }
};
exports.AdminMerchantController = AdminMerchantController;
__decorate([
    (0, common_1.Post)(':merchantProfileId/remove-blacklist'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'merchantProfileId', description: 'Merchant profile ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Remove merchant blacklist and optionally reopen a store (SUPER_ADMIN only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Blacklist removed' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('merchantProfileId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, remove_blacklist_dto_1.RemoveBlacklistDto, String, Object]),
    __metadata("design:returntype", Promise)
], AdminMerchantController.prototype, "removeBlacklist", null);
exports.AdminMerchantController = AdminMerchantController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Controller)('admin/merchants'),
    __metadata("design:paramtypes", [admin_merchant_service_1.AdminMerchantService])
], AdminMerchantController);
//# sourceMappingURL=admin-merchant.controller.js.map