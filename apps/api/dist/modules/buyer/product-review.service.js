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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductReviewService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const product_review_dto_1 = require("./dto/product-review.dto");
const buyer_visibility_util_1 = require("./buyer-visibility.util");
let ProductReviewService = class ProductReviewService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listProductReviews(productId, dto) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, ...buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE },
            select: { id: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const where = { productId, status: client_1.ReviewStatus.VISIBLE };
        const [items, total, aggregate] = await Promise.all([
            this.prisma.productReview.findMany({
                where,
                include: {
                    buyerProfile: { select: { id: true, name: true } },
                    order: { select: { id: true, orderNumber: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.productReview.count({ where }),
            this.prisma.productReview.aggregate({
                where,
                _avg: { rating: true },
                _count: { id: true },
            }),
        ]);
        return {
            reviews: items.map((r) => this.serialize(r)),
            aggregate: {
                ratingAvg: aggregate._avg.rating ?? 0,
                ratingCount: aggregate._count.id,
            },
            page,
            limit,
            total,
        };
    }
    async getProductRatingSummary(productId) {
        const aggregate = await this.prisma.productReview.aggregate({
            where: { productId, status: client_1.ReviewStatus.VISIBLE },
            _avg: { rating: true },
            _count: { id: true },
        });
        return {
            ratingAvg: aggregate._avg.rating ?? 0,
            ratingCount: aggregate._count.id,
        };
    }
    async createProductReview(userId, productId, dto) {
        const bp = await this.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!bp)
            throw new common_1.NotFoundException('Buyer profile not found');
        const product = await this.prisma.product.findFirst({
            where: { id: productId, ...buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE, store: buyer_visibility_util_1.STORE_VISIBLE_WHERE },
            select: { id: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const existing = await this.prisma.productReview.findUnique({
            where: { userId_productId: { userId, productId } },
        });
        if (existing)
            throw new common_1.ConflictException('You have already reviewed this product');
        const purchase = await this.findVerifiedPurchase(bp.id, productId, dto.orderId);
        if (!purchase) {
            throw new common_1.BadRequestException('Only verified buyers who received this product can review it');
        }
        const images = dto.images ?? [];
        if (images.length > product_review_dto_1.MAX_REVIEW_IMAGES) {
            throw new common_1.BadRequestException(`Maximum ${product_review_dto_1.MAX_REVIEW_IMAGES} review images allowed`);
        }
        const review = await this.prisma.productReview.create({
            data: {
                productId,
                userId,
                buyerProfileId: bp.id,
                orderId: purchase.orderId,
                orderItemId: purchase.orderItemId,
                rating: dto.rating,
                comment: dto.comment?.trim() || null,
                images: dto.images ?? [],
                verifiedPurchase: true,
                status: client_1.ReviewStatus.VISIBLE,
            },
            include: {
                buyerProfile: { select: { id: true, name: true } },
                order: { select: { id: true, orderNumber: true } },
            },
        });
        return this.serialize(review);
    }
    async findVerifiedPurchase(buyerProfileId, productId, orderId) {
        const item = await this.prisma.orderItem.findFirst({
            where: {
                productId,
                order: {
                    buyerProfileId,
                    status: client_1.OrderStatus.DELIVERED,
                    ...(orderId ? { id: orderId } : {}),
                },
            },
            select: { id: true, orderId: true },
            orderBy: { order: { completedAt: 'desc' } },
        });
        if (!item)
            return null;
        return { orderId: item.orderId, orderItemId: item.id };
    }
    serialize(review) {
        return {
            id: review.id,
            productId: review.productId,
            rating: review.rating,
            comment: review.comment,
            images: review.images,
            verifiedPurchase: review.verifiedPurchase,
            buyer: review.buyerProfile
                ? { id: review.buyerProfile.id, name: review.buyerProfile.name }
                : null,
            order: review.order
                ? { id: review.order.id, orderNumber: review.order.orderNumber }
                : null,
            createdAt: review.createdAt.toISOString(),
        };
    }
};
exports.ProductReviewService = ProductReviewService;
exports.ProductReviewService = ProductReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductReviewService);
//# sourceMappingURL=product-review.service.js.map