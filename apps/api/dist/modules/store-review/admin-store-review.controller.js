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
exports.AdminStoreReviewController = void 0;
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
const store_review_service_1 = require("./store-review.service");
const store_review_dto_1 = require("./dto/store-review.dto");
let AdminStoreReviewController = class AdminStoreReviewController {
    constructor(service) {
        this.service = service;
    }
    async list(dto, status) {
        const result = await this.service.listAdminReviews({ ...dto, status });
        return {
            success: true,
            data: result.reviews,
            meta: { page: result.page, limit: result.limit, total: result.total },
        };
    }
    async analytics() {
        const data = await this.service.getPlatformAnalytics();
        return { success: true, data };
    }
    async approve(user, id) {
        const data = await this.service.moderateReview(id, user.id, 'approve');
        return { success: true, data };
    }
    async hide(user, id, dto) {
        const data = await this.service.moderateReview(id, user.id, 'hide', dto.reason);
        return { success: true, data };
    }
    async restore(user, id) {
        const data = await this.service.moderateReview(id, user.id, 'restore');
        return { success: true, data };
    }
    async remove(user, id, dto) {
        const data = await this.service.moderateReview(id, user.id, 'remove', dto.reason);
        return { success: true, data };
    }
};
exports.AdminStoreReviewController = AdminStoreReviewController;
__decorate([
    (0, common_1.Get)('reviews'),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List reviews for moderation' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [store_review_dto_1.ListStoreReviewsDto, String]),
    __metadata("design:returntype", Promise)
], AdminStoreReviewController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('reviews/analytics'),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Platform review analytics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminStoreReviewController.prototype, "analytics", null);
__decorate([
    (0, common_1.Post)('reviews/:id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:manage'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminStoreReviewController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('reviews/:id/hide'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:manage'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, store_review_dto_1.ModerateReviewDto]),
    __metadata("design:returntype", Promise)
], AdminStoreReviewController.prototype, "hide", null);
__decorate([
    (0, common_1.Post)('reviews/:id/restore'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:manage'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminStoreReviewController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)('reviews/:id/remove'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:manage'),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, store_review_dto_1.ModerateReviewDto]),
    __metadata("design:returntype", Promise)
], AdminStoreReviewController.prototype, "remove", null);
exports.AdminStoreReviewController = AdminStoreReviewController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [store_review_service_1.StoreReviewService])
], AdminStoreReviewController);
//# sourceMappingURL=admin-store-review.controller.js.map