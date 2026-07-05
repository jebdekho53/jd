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
exports.AdminStoreController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const step_up_guard_1 = require("../../common/guards/step-up.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const require_step_up_decorator_1 = require("../../common/decorators/require-step-up.decorator");
const constants_1 = require("../../common/constants");
const admin_store_service_1 = require("./admin-store.service");
const list_store_approvals_dto_1 = require("./dto/list-store-approvals.dto");
const reject_store_dto_1 = require("./dto/reject-store.dto");
const request_documents_dto_1 = require("./dto/request-documents.dto");
const revoke_rejection_dto_1 = require("./dto/revoke-rejection.dto");
const suspend_store_dto_1 = require("./dto/suspend-store.dto");
const delete_store_dto_1 = require("./dto/delete-store.dto");
let AdminStoreController = class AdminStoreController {
    constructor(adminStoreService) {
        this.adminStoreService = adminStoreService;
    }
    async listApprovals(query) {
        const { stores, total } = await this.adminStoreService.listStoreApprovals(query);
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
    async getStoreDetail(storeId) {
        const data = await this.adminStoreService.getStoreDetail(storeId);
        return { success: true, data };
    }
    async approveStore(user, storeId, ip, req) {
        const data = await this.adminStoreService.approveStore(user.id, storeId, ip, req.headers['user-agent']);
        return { success: true, data };
    }
    async requestDocuments(user, storeId, dto, ip, req) {
        const data = await this.adminStoreService.requestDocuments(user.id, storeId, dto, ip, req.headers['user-agent']);
        return { success: true, data };
    }
    async rejectStore(user, storeId, dto, ip, req) {
        const data = await this.adminStoreService.rejectStore(user.id, storeId, dto, ip, req.headers['user-agent']);
        return { success: true, data };
    }
    async revokeRejection(user, storeId, dto, ip, req) {
        const data = await this.adminStoreService.revokeRejection(user.id, storeId, dto, ip, req.headers['user-agent']);
        return { success: true, data };
    }
    async suspendStore(user, storeId, dto, ip, req) {
        const data = await this.adminStoreService.suspendStore(user.id, storeId, dto, ip, req.headers['user-agent']);
        return { success: true, data };
    }
    async reinstateStore(user, storeId, ip, req) {
        const data = await this.adminStoreService.reinstateStore(user.id, storeId, ip, req.headers['user-agent']);
        return { success: true, data };
    }
    async deleteStore(user, storeId, dto, ip, req) {
        const data = await this.adminStoreService.deleteStore(user.id, storeId, dto, ip, req.headers['user-agent']);
        return { success: true, data };
    }
};
exports.AdminStoreController = AdminStoreController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('stores:approve'),
    (0, swagger_1.ApiOperation)({
        summary: 'List stores pending review (default) or filtered by any status',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store list with merchant info' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_store_approvals_dto_1.ListStoreApprovalsDto]),
    __metadata("design:returntype", Promise)
], AdminStoreController.prototype, "listApprovals", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('stores:approve'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get full store detail for admin review' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store detail' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminStoreController.prototype, "getStoreDetail", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:approve'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a PENDING_REVIEW or UNDER_REVIEW store — makes it live on the platform' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store approved and now live' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Store not in approvable status' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminStoreController.prototype, "approveStore", null);
__decorate([
    (0, common_1.Post)(':id/request-documents'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:approve'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Request additional documents from merchant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store moved to DOCUMENTS_REQUIRED' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, request_documents_dto_1.RequestDocumentsDto, String, Object]),
    __metadata("design:returntype", Promise)
], AdminStoreController.prototype, "requestDocuments", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:reject'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a store with a typed rejection (revocable or permanent blacklist)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store rejected' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Store not in rejectable status' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reject_store_dto_1.RejectStoreDto, String, Object]),
    __metadata("design:returntype", Promise)
], AdminStoreController.prototype, "rejectStore", null);
__decorate([
    (0, common_1.Post)(':id/revoke-rejection'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:approve'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a revocable rejection — REJECTED → UNDER_REVIEW' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rejection revoked, store back under review' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, revoke_rejection_dto_1.RevokeRejectionDto, String, Object]),
    __metadata("design:returntype", Promise)
], AdminStoreController.prototype, "revokeRejection", null);
__decorate([
    (0, common_1.Post)(':id/suspend'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:suspend'),
    (0, common_1.UseGuards)(step_up_guard_1.StepUpGuard),
    (0, require_step_up_decorator_1.RequireStepUp)(),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Suspend an APPROVED store' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store suspended' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, suspend_store_dto_1.SuspendStoreDto, String, Object]),
    __metadata("design:returntype", Promise)
], AdminStoreController.prototype, "suspendStore", null);
__decorate([
    (0, common_1.Post)(':id/reinstate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:approve'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Reinstate a SUSPENDED store back to APPROVED' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store reinstated' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminStoreController.prototype, "reinstateStore", null);
__decorate([
    (0, common_1.Post)(':id/delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:suspend'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Store ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a store — removes it from buyer discovery permanently' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store deleted' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, delete_store_dto_1.DeleteStoreDto, String, Object]),
    __metadata("design:returntype", Promise)
], AdminStoreController.prototype, "deleteStore", null);
exports.AdminStoreController = AdminStoreController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/store-approvals'),
    __metadata("design:paramtypes", [admin_store_service_1.AdminStoreService])
], AdminStoreController);
//# sourceMappingURL=admin-store.controller.js.map