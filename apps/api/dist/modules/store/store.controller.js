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
exports.StoreController = void 0;
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
const store_service_1 = require("./store.service");
const create_store_dto_1 = require("./dto/create-store.dto");
const update_store_dto_1 = require("./dto/update-store.dto");
const list_stores_dto_1 = require("./dto/list-stores.dto");
const upload_verification_document_dto_1 = require("./dto/upload-verification-document.dto");
let StoreController = class StoreController {
    constructor(storeService) {
        this.storeService = storeService;
    }
    async createStore(user, dto, ip) {
        const data = await this.storeService.createStore(user.id, dto, ip);
        return { success: true, data };
    }
    async listStores(user, query) {
        const { stores, total } = await this.storeService.listStores(user.id, query);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        return {
            success: true,
            data: stores,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getStore(user, storeId) {
        const data = await this.storeService.getStore(user.id, storeId);
        return { success: true, data };
    }
    async updateStore(user, storeId, dto, ip) {
        const data = await this.storeService.updateStore(user.id, storeId, dto, ip);
        return { success: true, data };
    }
    async submitForReview(user, storeId, ip, req) {
        const data = await this.storeService.submitForReview(user.id, storeId, ip);
        return { success: true, data };
    }
    async uploadVerificationDocument(user, storeId, dto, ip) {
        const data = await this.storeService.uploadVerificationDocument(user.id, storeId, dto, ip);
        return { success: true, data };
    }
    async submitDocumentsForReview(user, storeId, ip) {
        const data = await this.storeService.submitDocumentsForReview(user.id, storeId, ip);
        return { success: true, data };
    }
};
exports.StoreController = StoreController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new store in DRAFT status' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Store created' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_store_dto_1.CreateStoreDto, String]),
    __metadata("design:returntype", Promise)
], StoreController.prototype, "createStore", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List all stores for the authenticated merchant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store list' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_stores_dto_1.ListStoresDto]),
    __metadata("design:returntype", Promise)
], StoreController.prototype, "listStores", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single store (must be owned by merchant)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store detail' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Store not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not your store' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StoreController.prototype, "getStore", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update store — full edit for DRAFT, settings-only for APPROVED' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store updated' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Cannot edit in current status or not owner' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_store_dto_1.UpdateStoreDto, String]),
    __metadata("design:returntype", Promise)
], StoreController.prototype, "updateStore", null);
__decorate([
    (0, common_1.Post)(':id/submit-review'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:submit'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Submit DRAFT store for admin review' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store submitted — status: PENDING_REVIEW' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Store not ready (missing required fields)' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid status transition' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], StoreController.prototype, "submitForReview", null);
__decorate([
    (0, common_1.Post)(':id/documents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a verification document when DOCUMENTS_REQUIRED' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Document uploaded' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, upload_verification_document_dto_1.UploadVerificationDocumentDto, String]),
    __metadata("design:returntype", Promise)
], StoreController.prototype, "uploadVerificationDocument", null);
__decorate([
    (0, common_1.Post)(':id/submit-documents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:submit'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Submit uploaded documents — DOCUMENTS_REQUIRED → UNDER_REVIEW' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Documents submitted for admin review' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], StoreController.prototype, "submitDocumentsForReview", null);
exports.StoreController = StoreController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.STORES),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/stores'),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], StoreController);
//# sourceMappingURL=store.controller.js.map