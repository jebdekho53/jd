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
exports.MerchantOnboardingController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const constants_1 = require("../../common/constants");
const merchant_onboarding_service_1 = require("./merchant-onboarding.service");
const merchant_onboarding_dto_1 = require("./dto/merchant-onboarding.dto");
let MerchantOnboardingController = class MerchantOnboardingController {
    constructor(onboarding) {
        this.onboarding = onboarding;
    }
    async getStats() {
        const data = await this.onboarding.getPublicStats();
        return { success: true, data };
    }
    async getApplication(user) {
        const data = await this.onboarding.getOrCreateApplication(user.id);
        return { success: true, data };
    }
    async resolveLocation(user, dto) {
        const data = await this.onboarding.resolveStoreLocation(user.id, dto);
        return { success: true, data };
    }
    async updateStep(user, dto, ip) {
        const data = await this.onboarding.updateStep(user.id, dto, ip);
        return { success: true, data };
    }
    async uploadDocument(user, dto) {
        const data = await this.onboarding.uploadDocument(user.id, dto);
        return { success: true, data };
    }
    async saveBank(user, dto) {
        const data = await this.onboarding.saveBankAccount(user.id, dto);
        return { success: true, data };
    }
    validateGst(dto) {
        const data = this.onboarding.validateGst(dto.gstNumber);
        return { success: true, data };
    }
    async submit(user, ip) {
        const data = await this.onboarding.submitApplication(user.id, ip);
        return { success: true, data };
    }
    async status(user) {
        const data = await this.onboarding.getApplicationStatus(user.id);
        return { success: true, data };
    }
    async checklist(user) {
        const data = await this.onboarding.getPostApprovalChecklist(user.id);
        return { success: true, data };
    }
    async franchiseLead(user, dto) {
        return this.onboarding.submitFranchiseLead(user.id, dto);
    }
};
exports.MerchantOnboardingController = MerchantOnboardingController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Public merchant landing statistics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MerchantOnboardingController.prototype, "getStats", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('application'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantOnboardingController.prototype, "getApplication", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('application/resolve-location'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_onboarding_dto_1.ResolveStoreLocationDto]),
    __metadata("design:returntype", Promise)
], MerchantOnboardingController.prototype, "resolveLocation", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('application'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_onboarding_dto_1.UpdateOnboardingStepDto, String]),
    __metadata("design:returntype", Promise)
], MerchantOnboardingController.prototype, "updateStep", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('application/documents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_onboarding_dto_1.UploadMerchantDocumentDto]),
    __metadata("design:returntype", Promise)
], MerchantOnboardingController.prototype, "uploadDocument", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('application/bank'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_onboarding_dto_1.SaveBankAccountDto]),
    __metadata("design:returntype", Promise)
], MerchantOnboardingController.prototype, "saveBank", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('application/validate-gst'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [merchant_onboarding_dto_1.ValidateGstDto]),
    __metadata("design:returntype", void 0)
], MerchantOnboardingController.prototype, "validateGst", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('application/submit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantOnboardingController.prototype, "submit", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('status'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantOnboardingController.prototype, "status", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('checklist'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantOnboardingController.prototype, "checklist", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('franchise-lead'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merchant_onboarding_dto_1.FranchiseLeadDto]),
    __metadata("design:returntype", Promise)
], MerchantOnboardingController.prototype, "franchiseLead", null);
exports.MerchantOnboardingController = MerchantOnboardingController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, common_1.Controller)('merchant/onboarding'),
    __metadata("design:paramtypes", [merchant_onboarding_service_1.MerchantOnboardingService])
], MerchantOnboardingController);
//# sourceMappingURL=merchant-onboarding.controller.js.map