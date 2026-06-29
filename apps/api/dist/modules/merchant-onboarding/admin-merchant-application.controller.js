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
exports.AdminMerchantApplicationController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const merchant_onboarding_service_1 = require("./merchant-onboarding.service");
const merchant_onboarding_dto_1 = require("./dto/merchant-onboarding.dto");
let AdminMerchantApplicationController = class AdminMerchantApplicationController {
    constructor(onboarding) {
        this.onboarding = onboarding;
    }
    async list(query) {
        const data = await this.onboarding.listApplications(query);
        return { success: true, data };
    }
    async get(id) {
        const data = await this.onboarding.getApplication(id);
        return { success: true, data };
    }
    async approve(admin, id, ip) {
        const data = await this.onboarding.approveApplication(admin.id, id, ip);
        return { success: true, data };
    }
    async reject(admin, id, dto, ip) {
        const data = await this.onboarding.rejectApplication(admin.id, id, dto, ip);
        return { success: true, data };
    }
    async requestDocuments(admin, id, dto, ip) {
        const data = await this.onboarding.requestDocuments(admin.id, id, dto, ip);
        return { success: true, data };
    }
    async requestChanges(admin, id, dto) {
        const data = await this.onboarding.requestChanges(admin.id, id, dto);
        return { success: true, data };
    }
    async scheduleCall(admin, id, dto) {
        const data = await this.onboarding.scheduleCall(admin.id, id, dto);
        return { success: true, data };
    }
};
exports.AdminMerchantApplicationController = AdminMerchantApplicationController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List merchant applications' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [merchant_onboarding_dto_1.ListMerchantApplicationsDto]),
    __metadata("design:returntype", Promise)
], AdminMerchantApplicationController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get merchant application detail' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminMerchantApplicationController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminMerchantApplicationController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, merchant_onboarding_dto_1.RejectApplicationDto, String]),
    __metadata("design:returntype", Promise)
], AdminMerchantApplicationController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/request-documents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, merchant_onboarding_dto_1.RequestApplicationDocumentsDto, String]),
    __metadata("design:returntype", Promise)
], AdminMerchantApplicationController.prototype, "requestDocuments", null);
__decorate([
    (0, common_1.Post)(':id/request-changes'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, merchant_onboarding_dto_1.RequestApplicationChangesDto]),
    __metadata("design:returntype", Promise)
], AdminMerchantApplicationController.prototype, "requestChanges", null);
__decorate([
    (0, common_1.Post)(':id/schedule-call'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, merchant_onboarding_dto_1.ScheduleCallDto]),
    __metadata("design:returntype", Promise)
], AdminMerchantApplicationController.prototype, "scheduleCall", null);
exports.AdminMerchantApplicationController = AdminMerchantApplicationController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/merchant-applications'),
    __metadata("design:paramtypes", [merchant_onboarding_service_1.MerchantOnboardingService])
], AdminMerchantApplicationController);
//# sourceMappingURL=admin-merchant-application.controller.js.map