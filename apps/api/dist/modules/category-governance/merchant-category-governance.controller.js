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
exports.MerchantCategoryGovernanceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const merchant_category_request_service_1 = require("./merchant-category-request.service");
const category_governance_dto_1 = require("./dto/category-governance.dto");
const store_category_request_service_1 = require("./store-category-request.service");
let MerchantCategoryGovernanceController = class MerchantCategoryGovernanceController {
    constructor(legacyService, storeCategoryService) {
        this.legacyService = legacyService;
        this.storeCategoryService = storeCategoryService;
    }
    async listStoreCatalog(user, storeId, catalogKind) {
        const data = await this.storeCategoryService.listCatalog(user.id, storeId, catalogKind);
        return { success: true, data };
    }
    async listStoreRequests(user, storeId) {
        const data = await this.storeCategoryService.listStoreRequests(user.id, storeId);
        return { success: true, data };
    }
    async listStoreApproved(user, storeId, catalogKind) {
        const data = await this.storeCategoryService.listApprovedCategories(user.id, storeId, catalogKind);
        return { success: true, data };
    }
    async listStoreApprovedMenuCategories(user, storeId) {
        const data = await this.storeCategoryService.listApprovedCategories(user.id, storeId, client_1.CategoryCatalogKind.MENU);
        return { success: true, data };
    }
    async requestStoreAccess(user, storeId, dto, ip) {
        const data = await this.storeCategoryService.requestCategoryAccess(user.id, storeId, dto, ip);
        return { success: true, data };
    }
    async uploadStoreDocument(user, storeId, id, dto, ip) {
        const data = await this.storeCategoryService.uploadDocument(user.id, storeId, id, dto, ip);
        return { success: true, data };
    }
    async submitStoreDocuments(user, storeId, id, ip) {
        const data = await this.storeCategoryService.submitDocuments(user.id, storeId, id, ip);
        return { success: true, data };
    }
    async listCatalog(user, storeId, catalogKind) {
        if (storeId) {
            const data = await this.storeCategoryService.listCatalog(user.id, storeId, catalogKind);
            return { success: true, data };
        }
        const data = await this.legacyService.listCatalog(user.id);
        return { success: true, data };
    }
    async listMyRequests(user, storeId) {
        if (storeId) {
            const data = await this.storeCategoryService.listStoreRequests(user.id, storeId);
            return { success: true, data };
        }
        const data = await this.legacyService.listMyRequests(user.id);
        return { success: true, data };
    }
    async listApproved(user, storeId, catalogKind) {
        if (!storeId) {
            const data = await this.legacyService.listApprovedCategories(user.id);
            return { success: true, data };
        }
        const data = await this.storeCategoryService.listApprovedCategories(user.id, storeId, catalogKind);
        return { success: true, data };
    }
    async requestAccess(user, dto, ip, storeId) {
        if (storeId && 'subcategoryId' in dto) {
            const data = await this.storeCategoryService.requestCategoryAccess(user.id, storeId, dto, ip);
            return { success: true, data };
        }
        const data = await this.legacyService.requestCategoryAccess(user.id, dto, ip);
        return { success: true, data };
    }
    async uploadDocument(user, id, dto, ip) {
        const data = await this.legacyService.uploadDocument(user.id, id, dto, ip);
        return { success: true, data };
    }
    async submitDocuments(user, id, ip) {
        const data = await this.legacyService.submitDocuments(user.id, id, ip);
        return { success: true, data };
    }
};
exports.MerchantCategoryGovernanceController = MerchantCategoryGovernanceController;
__decorate([
    (0, common_1.Get)('stores/:storeId/categories/catalog'),
    (0, permissions_decorator_1.Permissions)('categories:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List global categories available to request for a store' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Query)('catalogKind')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "listStoreCatalog", null);
__decorate([
    (0, common_1.Get)('stores/:storeId/category-requests'),
    (0, permissions_decorator_1.Permissions)('categories:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List store category access requests' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "listStoreRequests", null);
__decorate([
    (0, common_1.Get)('stores/:storeId/categories/approved'),
    (0, permissions_decorator_1.Permissions)('categories:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List approved categories for product creation in a store' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Query)('catalogKind')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "listStoreApproved", null);
__decorate([
    (0, common_1.Get)('stores/:storeId/menu-categories/approved'),
    (0, permissions_decorator_1.Permissions)('categories:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List approved menu subcategories for restaurant menu setup' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "listStoreApprovedMenuCategories", null);
__decorate([
    (0, common_1.Post)('stores/:storeId/category-requests'),
    (0, permissions_decorator_1.Permissions)('categories:request'),
    (0, swagger_1.ApiOperation)({ summary: 'Request access to sell in a category/subcategory for a store' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, category_governance_dto_1.RequestStoreCategoryAccessDto, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "requestStoreAccess", null);
__decorate([
    (0, common_1.Post)('stores/:storeId/category-requests/:id/documents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:request'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload document for store category request' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, category_governance_dto_1.UploadCategoryDocumentDto, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "uploadStoreDocument", null);
__decorate([
    (0, common_1.Post)('stores/:storeId/category-requests/:id/submit-documents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:request'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit uploaded documents for admin review' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "submitStoreDocuments", null);
__decorate([
    (0, common_1.Get)('categories/catalog'),
    (0, permissions_decorator_1.Permissions)('categories:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List global categories (legacy — prefer store-scoped endpoint)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('storeId')),
    __param(2, (0, common_1.Query)('catalogKind')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "listCatalog", null);
__decorate([
    (0, common_1.Get)('category-requests'),
    (0, permissions_decorator_1.Permissions)('categories:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List category access requests' }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "listMyRequests", null);
__decorate([
    (0, common_1.Get)('categories/approved'),
    (0, permissions_decorator_1.Permissions)('categories:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List approved categories for product creation' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('storeId')),
    __param(2, (0, common_1.Query)('catalogKind')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "listApproved", null);
__decorate([
    (0, common_1.Post)('category-requests'),
    (0, permissions_decorator_1.Permissions)('categories:request'),
    (0, swagger_1.ApiOperation)({ summary: 'Request access to sell in a category (legacy)' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, category_governance_dto_1.RequestCategoryAccessDto, String, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "requestAccess", null);
__decorate([
    (0, common_1.Post)('category-requests/:id/documents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:request'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload document for category request' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, category_governance_dto_1.UploadCategoryDocumentDto, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Post)('category-requests/:id/submit-documents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('categories:request'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit uploaded documents for admin review' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MerchantCategoryGovernanceController.prototype, "submitDocuments", null);
exports.MerchantCategoryGovernanceController = MerchantCategoryGovernanceController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant'),
    __metadata("design:paramtypes", [merchant_category_request_service_1.MerchantCategoryRequestService,
        store_category_request_service_1.StoreCategoryRequestService])
], MerchantCategoryGovernanceController);
//# sourceMappingURL=merchant-category-governance.controller.js.map