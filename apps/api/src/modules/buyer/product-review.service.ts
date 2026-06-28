import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductReviewDto, ListProductReviewsDto, MAX_REVIEW_IMAGES } from './dto/product-review.dto';
import { PRODUCT_VISIBLE_WHERE, STORE_VISIBLE_WHERE } from './buyer-visibility.util';

@Injectable()
export class ProductReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async listProductReviews(productId: string, dto: ListProductReviewsDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, ...PRODUCT_VISIBLE_WHERE },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const where = { productId, status: ReviewStatus.VISIBLE };

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

  async getProductRatingSummary(productId: string) {
    const aggregate = await this.prisma.productReview.aggregate({
      where: { productId, status: ReviewStatus.VISIBLE },
      _avg: { rating: true },
      _count: { id: true },
    });
    return {
      ratingAvg: aggregate._avg.rating ?? 0,
      ratingCount: aggregate._count.id,
    };
  }

  async createProductReview(userId: string, productId: string, dto: CreateProductReviewDto) {
    const bp = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!bp) throw new NotFoundException('Buyer profile not found');

    const product = await this.prisma.product.findFirst({
      where: { id: productId, ...PRODUCT_VISIBLE_WHERE, store: STORE_VISIBLE_WHERE },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.productReview.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) throw new ConflictException('You have already reviewed this product');

    const purchase = await this.findVerifiedPurchase(bp.id, productId, dto.orderId);
    if (!purchase) {
      throw new BadRequestException('Only verified buyers who received this product can review it');
    }

    const images = dto.images ?? [];
    if (images.length > MAX_REVIEW_IMAGES) {
      throw new BadRequestException(`Maximum ${MAX_REVIEW_IMAGES} review images allowed`);
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
        status: ReviewStatus.VISIBLE,
      },
      include: {
        buyerProfile: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true } },
      },
    });

    return this.serialize(review);
  }

  private async findVerifiedPurchase(
    buyerProfileId: string,
    productId: string,
    orderId?: string,
  ): Promise<{ orderId: string; orderItemId: string } | null> {
    const item = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          buyerProfileId,
          status: OrderStatus.DELIVERED,
          ...(orderId ? { id: orderId } : {}),
        },
      },
      select: { id: true, orderId: true },
      orderBy: { order: { completedAt: 'desc' } },
    });
    if (!item) return null;
    return { orderId: item.orderId, orderItemId: item.id };
  }

  private serialize(review: {
    id: string;
    productId: string;
    rating: number;
    comment: string | null;
    images: string[];
    verifiedPurchase: boolean;
    createdAt: Date;
    buyerProfile?: { id: string; name: string } | null;
    order?: { id: string; orderNumber: string } | null;
  }) {
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
}
