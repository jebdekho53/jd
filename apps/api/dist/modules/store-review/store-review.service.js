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
exports.StoreReviewService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const store_reputation_service_1 = require("./store-reputation.service");
const REVIEW_INCLUDE = {
    buyerProfile: { select: { id: true, name: true } },
    order: { select: { id: true, orderNumber: true } },
};
let StoreReviewService = class StoreReviewService {
    constructor(prisma, reputation) {
        this.prisma = prisma;
        this.reputation = reputation;
    }
    async createReview(userId, orderId, dto) {
        const bp = await this.requireBuyerProfile(userId);
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, buyerProfileId: bp.id },
            include: { review: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (!this.reputation.isOrderReviewable(order.status)) {
            throw new common_1.BadRequestException('Only delivered orders can be reviewed');
        }
        if (order.review) {
            throw new common_1.ConflictException('This order already has a review');
        }
        const review = await this.prisma.review.create({
            data: {
                orderId: order.id,
                buyerProfileId: bp.id,
                storeId: order.storeId,
                userId,
                rating: dto.rating,
                storeExperience: dto.storeExperience,
                deliveryExperience: dto.deliveryExperience,
                productQuality: dto.productQuality,
                title: dto.title,
                comment: dto.review,
                images: dto.images ?? [],
                verifiedPurchase: true,
                status: client_1.ReviewStatus.VISIBLE,
            },
            include: REVIEW_INCLUDE,
        });
        await this.reputation.recomputeStoreReputation(order.storeId);
        return this.serializeReview(review);
    }
    async getOrderReview(userId, orderId) {
        const bp = await this.requireBuyerProfile(userId);
        const review = await this.prisma.review.findFirst({
            where: { orderId, buyerProfileId: bp.id },
            include: REVIEW_INCLUDE,
        });
        if (!review)
            return null;
        return this.serializeReview(review);
    }
    async updateReview(userId, orderId, dto) {
        const bp = await this.requireBuyerProfile(userId);
        const review = await this.prisma.review.findFirst({
            where: { orderId, buyerProfileId: bp.id },
        });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        if (review.status === client_1.ReviewStatus.REMOVED) {
            throw new common_1.BadRequestException('This review can no longer be edited');
        }
        const updated = await this.prisma.review.update({
            where: { id: review.id },
            data: {
                ...(dto.rating !== undefined && { rating: dto.rating }),
                ...(dto.storeExperience !== undefined && { storeExperience: dto.storeExperience }),
                ...(dto.deliveryExperience !== undefined && { deliveryExperience: dto.deliveryExperience }),
                ...(dto.productQuality !== undefined && { productQuality: dto.productQuality }),
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.review !== undefined && { comment: dto.review }),
                ...(dto.images !== undefined && { images: dto.images }),
            },
            include: REVIEW_INCLUDE,
        });
        await this.reputation.recomputeStoreReputation(review.storeId);
        return this.serializeReview(updated);
    }
    async reportReview(userId, reviewId, dto) {
        await this.requireBuyerProfile(userId);
        const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
        if (!review || review.status === client_1.ReviewStatus.REMOVED) {
            throw new common_1.NotFoundException('Review not found');
        }
        const updated = await this.prisma.review.update({
            where: { id: reviewId },
            data: {
                status: client_1.ReviewStatus.REPORTED,
                reportedAt: new Date(),
                reportReason: dto.reason,
            },
            include: REVIEW_INCLUDE,
        });
        return this.serializeReview(updated);
    }
    async listPublicStoreReviews(storeSlug, dto) {
        const store = await this.requireVisibleStore(storeSlug);
        return this.listStoreReviews(store.id, dto, [client_1.ReviewStatus.VISIBLE]);
    }
    async getPublicStoreReputation(storeSlug) {
        const store = await this.requireVisibleStore(storeSlug);
        return this.reputation.getStoreReputation(store.id);
    }
    async listMerchantReviews(userId, storeId, dto) {
        await this.assertStoreOwned(userId, storeId);
        return this.listStoreReviews(storeId, dto, [
            client_1.ReviewStatus.VISIBLE,
            client_1.ReviewStatus.REPORTED,
            client_1.ReviewStatus.HIDDEN,
        ]);
    }
    async getMerchantOverview(userId, storeId) {
        await this.assertStoreOwned(userId, storeId);
        const reputation = await this.reputation.getStoreReputation(storeId);
        const [lowRatingCount, recentCount] = await Promise.all([
            this.prisma.review.count({
                where: { storeId, rating: { lte: 2 }, status: { in: [client_1.ReviewStatus.VISIBLE, client_1.ReviewStatus.REPORTED] } },
            }),
            this.prisma.review.count({
                where: {
                    storeId,
                    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    status: { in: [client_1.ReviewStatus.VISIBLE, client_1.ReviewStatus.REPORTED] },
                },
            }),
        ]);
        return { ...reputation, lowRatingAlerts: lowRatingCount, recentReviews: recentCount };
    }
    async replyToReview(userId, storeId, reviewId, dto) {
        await this.assertStoreOwned(userId, storeId);
        const review = await this.prisma.review.findFirst({
            where: { id: reviewId, storeId },
        });
        if (!review || review.status === client_1.ReviewStatus.REMOVED) {
            throw new common_1.NotFoundException('Review not found');
        }
        const updated = await this.prisma.review.update({
            where: { id: reviewId },
            data: {
                merchantReply: dto.reply,
                merchantRepliedAt: new Date(),
            },
            include: REVIEW_INCLUDE,
        });
        await this.reputation.recomputeStoreReputation(storeId);
        return this.serializeReview(updated);
    }
    async listAdminReviews(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const where = {
            ...(dto.status && { status: dto.status }),
            ...(dto.rating && { rating: dto.rating }),
            ...(dto.q && {
                OR: [
                    { title: { contains: dto.q, mode: 'insensitive' } },
                    { comment: { contains: dto.q, mode: 'insensitive' } },
                    { reportReason: { contains: dto.q, mode: 'insensitive' } },
                ],
            }),
        };
        const [reviews, total] = await this.prisma.$transaction([
            this.prisma.review.findMany({
                where,
                include: {
                    ...REVIEW_INCLUDE,
                    store: { select: { id: true, name: true, slug: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.review.count({ where }),
        ]);
        return {
            reviews: reviews.map((r) => this.serializeReview(r)),
            total,
            page,
            limit,
        };
    }
    async moderateReview(reviewId, adminUserId, action, reason) {
        const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        let status;
        switch (action) {
            case 'approve':
                status = client_1.ReviewStatus.VISIBLE;
                break;
            case 'hide':
                status = client_1.ReviewStatus.HIDDEN;
                break;
            case 'restore':
                status = client_1.ReviewStatus.VISIBLE;
                break;
            case 'remove':
                status = client_1.ReviewStatus.REMOVED;
                break;
        }
        const updated = await this.prisma.review.update({
            where: { id: reviewId },
            data: {
                status,
                moderatedBy: adminUserId,
                moderatedAt: new Date(),
                ...(reason && action === 'remove' && { reportReason: reason }),
            },
            include: { ...REVIEW_INCLUDE, store: { select: { id: true, name: true, slug: true } } },
        });
        await this.reputation.recomputeStoreReputation(review.storeId);
        return this.serializeReview(updated);
    }
    async getPlatformAnalytics() {
        const [avg, distribution, worst, best] = await Promise.all([
            this.prisma.review.aggregate({
                where: { status: client_1.ReviewStatus.VISIBLE },
                _avg: { rating: true },
                _count: { id: true },
            }),
            this.prisma.review.groupBy({
                by: ['rating'],
                where: { status: client_1.ReviewStatus.VISIBLE },
                _count: { id: true },
            }),
            this.prisma.store.findMany({
                where: { status: client_1.StoreStatus.APPROVED, ratingCount: { gt: 0 } },
                orderBy: { ratingAvg: 'asc' },
                take: 5,
                select: { id: true, name: true, slug: true, ratingAvg: true, ratingCount: true },
            }),
            this.prisma.store.findMany({
                where: { status: client_1.StoreStatus.APPROVED, ratingCount: { gt: 0 } },
                orderBy: { ratingAvg: 'desc' },
                take: 5,
                select: { id: true, name: true, slug: true, ratingAvg: true, ratingCount: true },
            }),
        ]);
        return {
            platformRating: avg._avg.rating ?? 0,
            totalReviews: avg._count.id,
            distribution: Object.fromEntries(distribution.map((d) => [d.rating, d._count.id])),
            worstRatedStores: worst,
            bestRatedStores: best,
        };
    }
    async listStoreReviews(storeId, dto, statuses) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const where = {
            storeId,
            status: { in: statuses },
            ...(dto.rating && { rating: dto.rating }),
            ...(dto.q && {
                OR: [
                    { title: { contains: dto.q, mode: 'insensitive' } },
                    { comment: { contains: dto.q, mode: 'insensitive' } },
                ],
            }),
        };
        const [reviews, total] = await this.prisma.$transaction([
            this.prisma.review.findMany({
                where,
                include: REVIEW_INCLUDE,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.review.count({ where }),
        ]);
        return {
            reviews: reviews.map((r) => this.serializeReview(r)),
            total,
            page,
            limit,
        };
    }
    serializeReview(review) {
        return {
            id: review.id,
            orderId: review.orderId,
            storeId: review.storeId,
            rating: review.rating,
            storeExperience: review.storeExperience,
            deliveryExperience: review.deliveryExperience,
            productQuality: review.productQuality,
            title: review.title,
            review: review.comment,
            images: review.images ?? [],
            verifiedPurchase: review.verifiedPurchase,
            merchantReply: review.merchantReply,
            merchantRepliedAt: review.merchantRepliedAt?.toISOString?.() ?? review.merchantRepliedAt ?? null,
            status: review.status,
            reportedAt: review.reportedAt?.toISOString?.() ?? review.reportedAt ?? null,
            reportReason: review.reportReason,
            buyer: review.buyerProfile
                ? { id: review.buyerProfile.id, name: review.buyerProfile.name }
                : null,
            order: review.order
                ? { id: review.order.id, orderNumber: review.order.orderNumber }
                : null,
            store: review.store
                ? { id: review.store.id, name: review.store.name, slug: review.store.slug }
                : null,
            createdAt: review.createdAt?.toISOString?.() ?? review.createdAt,
            updatedAt: review.updatedAt?.toISOString?.() ?? review.updatedAt,
        };
    }
    async requireBuyerProfile(userId) {
        const bp = await this.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!bp)
            throw new common_1.NotFoundException('Buyer profile not found');
        return bp;
    }
    async requireVisibleStore(slug) {
        const store = await this.prisma.store.findFirst({
            where: {
                slug,
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                deletedAt: null,
            },
        });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
        return store;
    }
    async assertStoreOwned(userId, storeId) {
        const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.ForbiddenException('Merchant profile not found');
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
        });
        if (!store)
            throw new common_1.ForbiddenException('Store not found');
        return store;
    }
};
exports.StoreReviewService = StoreReviewService;
exports.StoreReviewService = StoreReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        store_reputation_service_1.StoreReputationService])
], StoreReviewService);
//# sourceMappingURL=store-review.service.js.map