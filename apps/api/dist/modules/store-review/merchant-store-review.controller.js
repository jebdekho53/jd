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
exports.MerchantStoreReviewController = void 0;
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
const store_review_service_1 = require("./store-review.service");
const store_review_dto_1 = require("./dto/store-review.dto");
let MerchantStoreReviewController = class MerchantStoreReviewController {
    constructor(service) {
        this.service = service;
    }
    async overview(user, storeId) {
        const data = await this.service.getMerchantOverview(user.id, storeId);
        return { success: true, data };
    }
    async list(user, storeId, dto) {
        const result = await this.service.listMerchantReviews(user.id, storeId, dto);
        return {
            success: true,
            data: result.reviews,
            meta: { page: result.page, limit: result.limit, total: result.total },
        };
    }
    async reply(user, storeId, reviewId, dto) {
        const data = await this.service.replyToReview(user.id, storeId, reviewId, dto);
        return { success: true, data };
    }
};
exports.MerchantStoreReviewController = MerchantStoreReviewController;
__decorate([
    (0, common_1.Get)(':storeId/reviews/overview'),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Rating overview for merchant review center' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MerchantStoreReviewController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)(':storeId/reviews'),
    (0, permissions_decorator_1.Permissions)('stores:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List store reviews for merchant' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, store_review_dto_1.ListStoreReviewsDto]),
    __metadata("design:returntype", Promise)
], MerchantStoreReviewController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':storeId/reviews/:reviewId/reply'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('stores:write'),
    (0, swagger_1.ApiOperation)({ summary: 'Reply to a customer review' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('reviewId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, store_review_dto_1.MerchantReplyDto]),
    __metadata("design:returntype", Promise)
], MerchantStoreReviewController.prototype, "reply", null);
exports.MerchantStoreReviewController = MerchantStoreReviewController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)('merchant/stores'),
    __metadata("design:paramtypes", [store_review_service_1.StoreReviewService])
], MerchantStoreReviewController);
//# sourceMappingURL=merchant-store-review.controller.js.map