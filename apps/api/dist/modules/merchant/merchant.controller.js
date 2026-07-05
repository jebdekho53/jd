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
exports.MerchantController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const step_up_guard_1 = require("../../common/guards/step-up.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const require_step_up_decorator_1 = require("../../common/decorators/require-step-up.decorator");
const constants_1 = require("../../common/constants");
const merchant_service_1 = require("./merchant.service");
const create_merchant_profile_dto_1 = require("./dto/create-merchant-profile.dto");
const update_merchant_profile_dto_1 = require("./dto/update-merchant-profile.dto");
let MerchantController = class MerchantController {
    constructor(merchantService) {
        this.merchantService = merchantService;
    }
    async createProfile(user, dto, ip) {
        const data = await this.merchantService.createProfile(user.id, dto, ip);
        return { success: true, data };
    }
    async getProfile(user) {
        const data = await this.merchantService.getProfile(user.id);
        return { success: true, data };
    }
    async updateProfile(user, dto, ip) {
        const data = await this.merchantService.updateProfile(user.id, dto, ip);
        return { success: true, data };
    }
    async updateBankAccount(user, dto) {
        return { success: true, message: 'Bank account updated successfully' };
    }
};
exports.MerchantController = MerchantController;
__decorate([
    (0, common_1.Post)('profile'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create merchant profile — upgrades account to MERCHANT role' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Profile created' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Profile already exists' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_merchant_profile_dto_1.CreateMerchantProfileDto, String]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "createProfile", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, roles_decorator_1.Roles)('MERCHANT', 'ADMIN', 'SUPER_ADMIN'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get own merchant profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Merchant profile' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Profile not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, roles_decorator_1.Roles)('MERCHANT', 'ADMIN', 'SUPER_ADMIN'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update merchant profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_merchant_profile_dto_1.UpdateMerchantProfileDto, String]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Patch)('bank-account'),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard, step_up_guard_1.StepUpGuard),
    (0, require_step_up_decorator_1.RequireStepUp)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update merchant bank account details (requires step-up)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MerchantController.prototype, "updateBankAccount", null);
exports.MerchantController = MerchantController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('merchant'),
    __metadata("design:paramtypes", [merchant_service_1.MerchantService])
], MerchantController);
//# sourceMappingURL=merchant.controller.js.map