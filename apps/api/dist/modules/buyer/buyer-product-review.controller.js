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
exports.BuyerProductReviewController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const constants_1 = require("../../common/constants");
const product_review_service_1 = require("./product-review.service");
const product_review_dto_1 = require("./dto/product-review.dto");
let BuyerProductReviewController = class BuyerProductReviewController {
    constructor(reviews) {
        this.reviews = reviews;
    }
    async list(productId, dto) {
        const data = await this.reviews.listProductReviews(productId, dto);
        return {
            success: true,
            data: data.reviews,
            meta: {
                page: data.page,
                limit: data.limit,
                total: data.total,
                aggregate: data.aggregate,
            },
        };
    }
    async create(user, productId, dto) {
        const data = await this.reviews.createProductReview(user.id, productId, dto);
        return { success: true, data };
    }
};
exports.BuyerProductReviewController = BuyerProductReviewController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':productId/reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'List product reviews with aggregate rating' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_review_dto_1.ListProductReviewsDto]),
    __metadata("design:returntype", Promise)
], BuyerProductReviewController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':productId/reviews'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a verified product review' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('productId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, product_review_dto_1.CreateProductReviewDto]),
    __metadata("design:returntype", Promise)
], BuyerProductReviewController.prototype, "create", null);
exports.BuyerProductReviewController = BuyerProductReviewController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.BUYERS),
    (0, common_1.Controller)('buyer/products'),
    __metadata("design:paramtypes", [product_review_service_1.ProductReviewService])
], BuyerProductReviewController);
//# sourceMappingURL=buyer-product-review.controller.js.map