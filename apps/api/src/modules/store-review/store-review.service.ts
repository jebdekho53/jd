import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, ReviewStatus, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StoreReputationService } from './store-reputation.service';
import {
  CreateStoreReviewDto,
  ListStoreReviewsDto,
  MerchantReplyDto,
  ReportReviewDto,
  UpdateStoreReviewDto,
} from './dto/store-review.dto';

const REVIEW_INCLUDE = {
  buyerProfile: { select: { id: true, name: true } },
  order: { select: { id: true, orderNumber: true } },
} satisfies Prisma.ReviewInclude;

@Injectable()
export class StoreReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: StoreReputationService,
  ) {}

  // ── Buyer ─────────────────────────────────────────────────────────────────

  async createReview(userId: string, orderId: string, dto: CreateStoreReviewDto) {
    const bp = await this.requireBuyerProfile(userId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerProfileId: bp.id },
      include: { review: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!this.reputation.isOrderReviewable(order.status)) {
      throw new BadRequestException('Only delivered orders can be reviewed');
    }
    if (order.review) {
      throw new ConflictException('This order already has a review');
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
        status: ReviewStatus.VISIBLE,
      },
      include: REVIEW_INCLUDE,
    });

    await this.reputation.recomputeStoreReputation(order.storeId);
    return this.serializeReview(review);
  }

  async getOrderReview(userId: string, orderId: string) {
    const bp = await this.requireBuyerProfile(userId);
    const review = await this.prisma.review.findFirst({
      where: { orderId, buyerProfileId: bp.id },
      include: REVIEW_INCLUDE,
    });
    if (!review) return null;
    return this.serializeReview(review);
  }

  async updateReview(userId: string, orderId: string, dto: UpdateStoreReviewDto) {
    const bp = await this.requireBuyerProfile(userId);
    const review = await this.prisma.review.findFirst({
      where: { orderId, buyerProfileId: bp.id },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.status === ReviewStatus.REMOVED) {
      throw new BadRequestException('This review can no longer be edited');
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

  async reportReview(userId: string, reviewId: string, dto: ReportReviewDto) {
    await this.requireBuyerProfile(userId);
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.status === ReviewStatus.REMOVED) {
      throw new NotFoundException('Review not found');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.REPORTED,
        reportedAt: new Date(),
        reportReason: dto.reason,
      },
      include: REVIEW_INCLUDE,
    });
    return this.serializeReview(updated);
  }

  // ── Public store reviews ──────────────────────────────────────────────────

  async listPublicStoreReviews(storeSlug: string, dto: ListStoreReviewsDto) {
    const store = await this.requireVisibleStore(storeSlug);
    return this.listStoreReviews(store.id, dto, [ReviewStatus.VISIBLE]);
  }

  async getPublicStoreReputation(storeSlug: string) {
    const store = await this.requireVisibleStore(storeSlug);
    return this.reputation.getStoreReputation(store.id);
  }

  // ── Merchant ──────────────────────────────────────────────────────────────

  async listMerchantReviews(userId: string, storeId: string, dto: ListStoreReviewsDto) {
    await this.assertStoreOwned(userId, storeId);
    return this.listStoreReviews(storeId, dto, [
      ReviewStatus.VISIBLE,
      ReviewStatus.REPORTED,
      ReviewStatus.HIDDEN,
    ]);
  }

  async getMerchantOverview(userId: string, storeId: string) {
    await this.assertStoreOwned(userId, storeId);
    const reputation = await this.reputation.getStoreReputation(storeId);

    const [lowRatingCount, recentCount] = await Promise.all([
      this.prisma.review.count({
        where: { storeId, rating: { lte: 2 }, status: { in: [ReviewStatus.VISIBLE, ReviewStatus.REPORTED] } },
      }),
      this.prisma.review.count({
        where: {
          storeId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          status: { in: [ReviewStatus.VISIBLE, ReviewStatus.REPORTED] },
        },
      }),
    ]);

    return { ...reputation, lowRatingAlerts: lowRatingCount, recentReviews: recentCount };
  }

  async replyToReview(userId: string, storeId: string, reviewId: string, dto: MerchantReplyDto) {
    await this.assertStoreOwned(userId, storeId);
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, storeId },
    });
    if (!review || review.status === ReviewStatus.REMOVED) {
      throw new NotFoundException('Review not found');
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

  // ── Admin ─────────────────────────────────────────────────────────────────

  async listAdminReviews(dto: ListStoreReviewsDto & { status?: ReviewStatus }) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const where: Prisma.ReviewWhereInput = {
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

  async moderateReview(
    reviewId: string,
    adminUserId: string,
    action: 'approve' | 'hide' | 'restore' | 'remove',
    reason?: string,
  ) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    let status: ReviewStatus;
    switch (action) {
      case 'approve':
        status = ReviewStatus.VISIBLE;
        break;
      case 'hide':
        status = ReviewStatus.HIDDEN;
        break;
      case 'restore':
        status = ReviewStatus.VISIBLE;
        break;
      case 'remove':
        status = ReviewStatus.REMOVED;
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
        where: { status: ReviewStatus.VISIBLE },
        _avg: { rating: true },
        _count: { id: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { status: ReviewStatus.VISIBLE },
        _count: { id: true },
      }),
      this.prisma.store.findMany({
        where: { status: StoreStatus.APPROVED, ratingCount: { gt: 0 } },
        orderBy: { ratingAvg: 'asc' },
        take: 5,
        select: { id: true, name: true, slug: true, ratingAvg: true, ratingCount: true },
      }),
      this.prisma.store.findMany({
        where: { status: StoreStatus.APPROVED, ratingCount: { gt: 0 } },
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

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async listStoreReviews(
    storeId: string,
    dto: ListStoreReviewsDto,
    statuses: ReviewStatus[],
  ) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const where: Prisma.ReviewWhereInput = {
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

  private serializeReview(review: any) {
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

  private async requireBuyerProfile(userId: string) {
    const bp = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!bp) throw new NotFoundException('Buyer profile not found');
    return bp;
  }

  private async requireVisibleStore(slug: string) {
    const store = await this.prisma.store.findFirst({
      where: {
        slug,
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
      },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  private async assertStoreOwned(userId: string, storeId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Merchant profile not found');
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
    });
    if (!store) throw new ForbiddenException('Store not found');
    return store;
  }
}
