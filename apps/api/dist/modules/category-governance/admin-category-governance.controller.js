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
exports.AdminCategoryGovernanceController = void 0;
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
const admin_category_governance_service_1 = require("./admin-category-governance.service");
const category_governance_dto_1 = require("./dto/category-governance.dto");
let AdminCategoryGovernanceController = class AdminCategoryGovernanceController {
    constructor(service) {
        this.service = service;
    }
    async listCategories() {
        const data = await this.service.listGlobalCategories();
        return { success: true, data };
    }
    async createCategory(user, dto) {
        const data = await this.service.createGlobalCategory(dto, user.id);
        return { success: true, data };
    }
    async updateCategory(user, id, dto, ip) {
        const data = await this.service.updateGlobalCategory(id, dto, user.id);
        return { success: true, data };
    }
    async deleteCategory(user, id, ip) {
        const data = await this.service.softDeleteGlobalCategory(id, user.id);
        return { success: true, data };
    }
    async getCategoryStatistics() {
        const data = await this.service.getCategoryStatistics();
        return { success: true, data };
    }
    async listRequests(dto) {
        const { requests, total } = await this.service.listCategoryRequests(dto);
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        return {
            success: true,
            data: requests,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getRequest(id) {
        const data = await this.service.getCategoryRequest(id);
        return { success: true, data };
    }
    async approve(user, id, ip) {
        const data = await this.service.approveCategoryRequest(id, user.id, ip);
        return { success: true, data };
    }
    async reject(user, id, dto, ip) {
        const data = await this.service.rejectCategoryRequest(id, user.id, dto, ip);
        return { success: true, data };
    }
    async requestDocuments(user, id, dto, ip) {
        const data = await this.service.requestCategoryDocuments(id, user.id, dto, ip);
        return { success: true, data };
    }
    async revokeRejection(user, id, dto, ip) {
        const data = await this.service.revokeCategoryRejection(id, user.id, dto, ip);
        return { success: true, data };
    }
    async moveToReview(user, id, ip) {
        const data = await this.service.moveCategoryRequestToReview(id, user.id, ip);
        return { success: true, data };
    }
    async revokeApproval(user, id, dto, ip) {
        const data = await this.service.revokeCategoryApproval(id, user.id, dto, ip);
        return { success: true, data };
    }
    async bulkAction(user, dto, ip) {
        const data = await this.service.bulkCategoryRequestAction(dto.requestIds, dto.action, user.id, { reason: dto.reason, documentTypes: dto.documentTypes }, ip);
        return { success: true, data };
    }
};
exports.AdminCategoryGovernanceController = AdminCategoryGovernanceController;
__decorate([
    (0, common_1.Get)('categories'),
    (0, permissions_decorator_1.Permissions)('categories:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List global platform categories' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Post)('categories'),
    (0, permissions_decorator_1.Permissions)('categories:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a global category or subcategory' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, category_governance_dto_1.CreateGlobalCategoryDto]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Patch)('categories/:id'),
    (0, permissions_decorator_1.Permissions)('categories:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a global category' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, category_governance_dto_1.UpdateGlobalCategoryDto, String]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a global category (cascades to subcategories)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Get)('categories/statistics'),
    (0, permissions_decorator_1.Permissions)('categories:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Category governance statistics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "getCategoryStatistics", null);
__decorate([
    (0, common_1.Get)('category-requests'),
    (0, permissions_decorator_1.Permissions)('categories:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'List merchant category access requests' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [category_governance_dto_1.ListCategoryRequestsDto]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "listRequests", null);
__decorate([
    (0, common_1.Get)('category-requests/:id'),
    (0, permissions_decorator_1.Permissions)('categories:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Get category request detail' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "getRequest", null);
__decorate([
    (0, common_1.Post)('category-requests/:id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve merchant category access' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('category-requests/:id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject merchant category access' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, category_governance_dto_1.RejectCategoryRequestDto, String]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)('category-requests/:id/request-documents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Request compliance documents for category access' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, category_governance_dto_1.RequestCategoryDocumentsDto, String]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "requestDocuments", null);
__decorate([
    (0, common_1.Post)('category-requests/:id/revoke-rejection'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a category rejection and reopen request' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, category_governance_dto_1.RevokeCategoryRejectionDto, String]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "revokeRejection", null);
__decorate([
    (0, common_1.Post)('category-requests/:id/move-to-review'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Move a pending category request to under review' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "moveToReview", null);
__decorate([
    (0, common_1.Post)('category-requests/:id/revoke-approval'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke an approved store category grant' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, category_governance_dto_1.RejectCategoryRequestDto, String]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "revokeApproval", null);
__decorate([
    (0, common_1.Post)('category-requests/bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk approve/reject/request-documents/move-to-review' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, category_governance_dto_1.BulkCategoryRequestActionDto, String]),
    __metadata("design:returntype", Promise)
], AdminCategoryGovernanceController.prototype, "bulkAction", null);
exports.AdminCategoryGovernanceController = AdminCategoryGovernanceController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_category_governance_service_1.AdminCategoryGovernanceService])
], AdminCategoryGovernanceController);
//# sourceMappingURL=admin-category-governance.controller.js.map