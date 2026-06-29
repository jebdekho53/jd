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
exports.PublicStoreReviewController = exports.BuyerStoreReviewController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const constants_1 = require("../../common/constants");
const store_review_service_1 = require("./store-review.service");
const store_review_dto_1 = require("./dto/store-review.dto");
let BuyerStoreReviewController = class BuyerStoreReviewController {
    constructor(service) {
        this.service = service;
    }
    async create(user, orderId, dto) {
        const data = await this.service.createReview(user.id, orderId, dto);
        return { success: true, data };
    }
    async get(user, orderId) {
        const data = await this.service.getOrderReview(user.id, orderId);
        return { success: true, data };
    }
    async update(user, orderId, dto) {
        const data = await this.service.updateReview(user.id, orderId, dto);
        return { success: true, data };
    }
    async report(user, reviewId, dto) {
        const data = await this.service.reportReview(user.id, reviewId, dto);
        return { success: true, data };
    }
};
exports.BuyerStoreReviewController = BuyerStoreReviewController;
__decorate([
    (0, common_1.Post)('orders/:orderId/review'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a verified store review for a delivered order' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, store_review_dto_1.CreateStoreReviewDto]),
    __metadata("design:returntype", Promise)
], BuyerStoreReviewController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('orders/:orderId/review'),
    (0, swagger_1.ApiOperation)({ summary: 'Get review for an order' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuyerStoreReviewController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)('orders/:orderId/review'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing review' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, store_review_dto_1.UpdateStoreReviewDto]),
    __metadata("design:returntype", Promise)
], BuyerStoreReviewController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('reviews/:reviewId/report'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Report a review' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('reviewId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, store_review_dto_1.ReportReviewDto]),
    __metadata("design:returntype", Promise)
], BuyerStoreReviewController.prototype, "report", null);
exports.BuyerStoreReviewController = BuyerStoreReviewController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.Controller)('buyer'),
    __metadata("design:paramtypes", [store_review_service_1.StoreReviewService])
], BuyerStoreReviewController);
let PublicStoreReviewController = class PublicStoreReviewController {
    constructor(service) {
        this.service = service;
    }
    async list(slug, dto) {
        const result = await this.service.listPublicStoreReviews(slug, dto);
        return {
            success: true,
            data: result.reviews,
            meta: { page: result.page, limit: result.limit, total: result.total },
        };
    }
    async reputation(slug) {
        const data = await this.service.getPublicStoreReputation(slug);
        return { success: true, data };
    }
};
exports.PublicStoreReviewController = PublicStoreReviewController;
__decorate([
    (0, common_1.Get)(':slug/reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'List public store reviews' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, store_review_dto_1.ListStoreReviewsDto]),
    __metadata("design:returntype", Promise)
], PublicStoreReviewController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':slug/reputation'),
    (0, swagger_1.ApiOperation)({ summary: 'Get store reputation summary' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicStoreReviewController.prototype, "reputation", null);
exports.PublicStoreReviewController = PublicStoreReviewController = __decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('buyer/stores'),
    __metadata("design:paramtypes", [store_review_service_1.StoreReviewService])
], PublicStoreReviewController);
//# sourceMappingURL=buyer-store-review.controller.js.map