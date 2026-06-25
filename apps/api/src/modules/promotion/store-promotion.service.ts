import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Coupon, Prisma, StorePromotion } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PromotionPricingService, PromoCartItem } from './promotion-pricing.service';
import {
  CreateCouponDto,
  CreateStorePromotionDto,
  ListAdminPromotionsDto,
  ListPromotionsDto,
  UpdateStorePromotionDto,
} from './dto/promotion.dto';
import { PromotionNotificationService } from './promotion-notification.service';
import { OfferEngineService } from './offer-engine.service';
import { OfferCacheService } from './offer-cache.service';

@Injectable()
export class StorePromotionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PromotionPricingService,
    private readonly notifications: PromotionNotificationService,
    private readonly offerEngine: OfferEngineService,
    private readonly offerCache: OfferCacheService,
  ) {}

  // ── Merchant store promotions ─────────────────────────────────────────────

  async create(userId: string, storeId: string, dto: CreateStorePromotionDto) {
    await this.assertStoreOwned(userId, storeId);
    const promo = await this.prisma.storePromotion.create({
      data: {
        storeId,
        name: dto.name,
        description: dto.description,
        offerType: dto.offerType,
        target: dto.target,
        categoryId: dto.categoryId,
        productId: dto.productId,
        discountValue: dto.discountValue,
        buyQuantity: dto.buyQuantity,
        getQuantity: dto.getQuantity,
        minOrderAmount: dto.minOrderAmount ?? 0,
        maxDiscount: dto.maxDiscount,
        usageLimit: dto.usageLimit,
        startsAt: new Date(dto.startsAt),
        expiresAt: new Date(dto.expiresAt),
      },
    });
    void this.notifications.notifyStorePromotion(storeId, promo.name);
    await this.offerCache.invalidateStore(storeId);
    return this.serializePromotion(promo);
  }

  async update(userId: string, storeId: string, id: string, dto: UpdateStorePromotionDto) {
    await this.assertStoreOwned(userId, storeId);
    const existing = await this.requirePromotion(storeId, id);
    const updated = await this.prisma.storePromotion.update({
      where: { id: existing.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
        ...(dto.expiresAt !== undefined && { expiresAt: new Date(dto.expiresAt) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return this.serializePromotion(updated);
  }

  async pause(userId: string, storeId: string, id: string) {
    await this.assertStoreOwned(userId, storeId);
    await this.requirePromotion(storeId, id);
    const updated = await this.prisma.storePromotion.update({
      where: { id },
      data: { pausedAt: new Date(), isActive: false },
    });
    return this.serializePromotion(updated);
  }

  async resume(userId: string, storeId: string, id: string) {
    await this.assertStoreOwned(userId, storeId);
    await this.requirePromotion(storeId, id);
    const updated = await this.prisma.storePromotion.update({
      where: { id },
      data: { pausedAt: null, isActive: true },
    });
    return this.serializePromotion(updated);
  }

  async remove(userId: string, storeId: string, id: string) {
    await this.assertStoreOwned(userId, storeId);
    await this.requirePromotion(storeId, id);
    await this.prisma.storePromotion.delete({ where: { id } });
    return { deleted: true };
  }

  async listMerchant(userId: string, storeId: string, dto: ListPromotionsDto) {
    await this.assertStoreOwned(userId, storeId);
    return this.listPromotions({ ...dto, storeId });
  }

  async merchantOverview(userId: string, storeId: string) {
    await this.assertStoreOwned(userId, storeId);
    const [active, usages, revenue] = await Promise.all([
      this.prisma.storePromotion.count({
        where: { storeId, isActive: true, pausedAt: null, expiresAt: { gte: new Date() } },
      }),
      this.prisma.promotionUsage.count({
        where: { promotion: { storeId } },
      }),
      this.prisma.promotionUsage.aggregate({
        where: { promotion: { storeId } },
        _sum: { discountApplied: true },
      }),
    ]);

    const top = await this.prisma.storePromotion.findFirst({
      where: { storeId },
      orderBy: { usedCount: 'desc' },
    });

    return {
      activePromotions: active,
      totalUsages: usages,
      totalDiscountGiven: Number(revenue._sum.discountApplied ?? 0),
      ordersInfluenced: usages,
      topPromotion: top ? this.serializePromotion(top) : null,
    };
  }

  // ── Buyer / public ────────────────────────────────────────────────────────

  async listStoreOffers(storeSlug: string) {
    const store = await this.requireVisibleStore(storeSlug);
    const now = new Date();
    const promos = await this.prisma.storePromotion.findMany({
      where: {
        storeId: store.id,
        isActive: true,
        pausedAt: null,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
    return promos.map((p) => this.serializePromotion(p));
  }

  async listStoreCoupons(storeSlug: string, buyerProfileId?: string) {
    const store = await this.requireVisibleStore(storeSlug);
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
        suspendedAt: null,
        startsAt: { lte: now },
        expiresAt: { gte: now },
        OR: [{ storeId: store.id }, { scope: 'PLATFORM' }],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (!buyerProfileId) {
      return coupons.map((c) => this.serializeCoupon(c));
    }

    const filtered: Coupon[] = [];
    for (const c of coupons) {
      const usage = await this.prisma.couponUsage.count({
        where: { couponId: c.id, buyerProfileId },
      });
      if (usage < c.perUserLimit) filtered.push(c);
    }
    return filtered.map((c) => this.serializeCoupon(c));
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  async listAdmin(dto: ListAdminPromotionsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const now = new Date();

    const promoWhere: Prisma.StorePromotionWhereInput = {
      ...(dto.storeId && { storeId: dto.storeId }),
      ...(dto.q && {
        OR: [
          { name: { contains: dto.q, mode: 'insensitive' } },
          { description: { contains: dto.q, mode: 'insensitive' } },
        ],
      }),
      ...(dto.status === 'active' && {
        isActive: true,
        pausedAt: null,
        expiresAt: { gte: now },
      }),
      ...(dto.status === 'paused' && { pausedAt: { not: null } }),
      ...(dto.status === 'expired' && { expiresAt: { lt: now } }),
    };

    const [promotions, promoTotal, coupons, couponTotal] = await this.prisma.$transaction([
      this.prisma.storePromotion.findMany({
        where: promoWhere,
        include: { store: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.storePromotion.count({ where: promoWhere }),
      this.prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { store: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.coupon.count(),
    ]);

    return {
      promotions: promotions.map((p) => ({
        ...this.serializePromotion(p),
        store: p.store,
      })),
      coupons: coupons.map((c) => ({ ...this.serializeCoupon(c), store: c.store })),
      total: promoTotal + couponTotal,
      page,
      limit,
    };
  }

  async createPlatformCoupon(adminUserId: string, dto: CreateCouponDto) {
    const coupon = await this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
        type: dto.type,
        kind: dto.kind ?? 'PLATFORM_SPONSORED',
        scope: dto.scope,
        sponsor: dto.sponsor ?? 'PLATFORM',
        storeId: dto.storeId,
        categoryId: dto.categoryId,
        productId: dto.productId,
        discountValue: dto.discountValue,
        maxDiscount: dto.maxDiscount,
        minOrderAmount: dto.minOrderAmount ?? 0,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit ?? 1,
        firstOrderOnly: dto.firstOrderOnly ?? false,
        startsAt: new Date(dto.startsAt),
        expiresAt: new Date(dto.expiresAt),
        createdById: adminUserId,
      },
    });
    return this.serializeCoupon(coupon);
  }

  async suspendCoupon(adminUserId: string, couponId: string) {
    const updated = await this.prisma.coupon.update({
      where: { id: couponId },
      data: { suspendedAt: new Date(), suspendedBy: adminUserId, isActive: false },
    });
    return this.serializeCoupon(updated);
  }

  async getPlatformAnalytics() {
    const [couponUsages, promoUsages, topCoupons, abuseCandidates] = await Promise.all([
      this.prisma.couponUsage.aggregate({ _sum: { discountApplied: true }, _count: { id: true } }),
      this.prisma.promotionUsage.aggregate({ _sum: { discountApplied: true }, _count: { id: true } }),
      this.prisma.coupon.findMany({
        orderBy: { usedCount: 'desc' },
        take: 5,
        select: { id: true, code: true, name: true, usedCount: true, usageLimit: true },
      }),
      this.prisma.couponUsage.groupBy({
        by: ['buyerProfileId', 'couponId'],
        _count: { id: true },
        having: { id: { _count: { gt: 3 } } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    const platformSavings =
      Number(couponUsages._sum.discountApplied ?? 0) +
      Number(promoUsages._sum.discountApplied ?? 0);

    return {
      platformSavings,
      couponRedemptions: couponUsages._count.id,
      promotionRedemptions: promoUsages._count.id,
      topCoupons,
      abuseCandidates: abuseCandidates.length,
    };
  }

  async enrichCartPromotions(
    cartId: string,
    storeId: string,
    buyerProfileId: string,
    baseDeliveryFee: number,
    catalogSavings: number,
    items: PromoCartItem[],
    appliedCouponId: string | null,
    appliedPromotionId: string | null,
    appliedOfferId: string | null,
    lat?: number,
    lng?: number,
  ) {
    return this.offerEngine.evaluateCheckout({
      cartId,
      storeId,
      buyerProfileId,
      baseDeliveryFee,
      catalogSavings,
      items,
      appliedCouponId,
      appliedPromotionId,
      appliedOfferId,
      lat,
      lng,
    });
  }

  async redeemOnOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
    buyerProfileId: string,
    couponId: string | null,
    promotionId: string | null,
    offerId: string | null,
    couponDiscount: number,
    offerDiscount: number,
    cashbackAmount = 0,
    rewardPointsBonus = 0,
    gmvImpact = 0,
  ) {
    if (couponId && couponDiscount > 0) {
      await tx.couponUsage.create({
        data: { couponId, orderId, buyerProfileId, discountApplied: couponDiscount },
      });
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
      await tx.order.update({ where: { id: orderId }, data: { couponId } });
    }

    if (promotionId && offerDiscount > 0 && !offerId) {
      await tx.promotionUsage.create({
        data: {
          promotionId,
          orderId,
          buyerProfileId,
          discountApplied: offerDiscount,
        },
      });
      await tx.storePromotion.update({
        where: { id: promotionId },
        data: { usedCount: { increment: 1 } },
      });
    }

    if (offerId) {
      await this.offerEngine.redeemOffers(
        tx,
        orderId,
        buyerProfileId,
        offerId,
        offerDiscount,
        cashbackAmount,
        rewardPointsBonus,
        gmvImpact,
      );
    }
  }

  // ── Discovery ─────────────────────────────────────────────────────────────

  async getTopDeals(limit = 10) {
    const now = new Date();
    const promos = await this.prisma.storePromotion.findMany({
      where: {
        isActive: true,
        pausedAt: null,
        startsAt: { lte: now },
        expiresAt: { gte: now },
        offerType: { not: 'FREE_DELIVERY' },
      },
      include: { store: { select: { id: true, name: true, slug: true, logoUrl: true } } },
      orderBy: { discountValue: 'desc' },
      take: limit,
    });
    return promos.map((p) => ({
      ...this.serializePromotion(p),
      store: p.store,
      badge: this.offerBadge(p),
    }));
  }

  async getTrendingOffers(limit = 10) {
    const promos = await this.prisma.storePromotion.findMany({
      where: { isActive: true, pausedAt: null, expiresAt: { gte: new Date() } },
      include: { store: { select: { id: true, name: true, slug: true, logoUrl: true } } },
      orderBy: { usedCount: 'desc' },
      take: limit,
    });
    return promos.map((p) => ({
      ...this.serializePromotion(p),
      store: p.store,
      badge: this.offerBadge(p),
    }));
  }

  async getFreeDeliveryStores(limit = 10) {
    const now = new Date();
    const promos = await this.prisma.storePromotion.findMany({
      where: {
        isActive: true,
        pausedAt: null,
        offerType: 'FREE_DELIVERY',
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            deliveryFee: true,
            ratingAvg: true,
          },
        },
      },
      take: limit,
    });
    return promos.map((p) => ({ store: p.store, promotion: this.serializePromotion(p) }));
  }

  async getStorePromoBadges(storeIds: string[]) {
    const now = new Date();
    const promos = await this.prisma.storePromotion.findMany({
      where: {
        storeId: { in: storeIds },
        isActive: true,
        pausedAt: null,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
    });
    const coupons = await this.prisma.coupon.findMany({
      where: {
        storeId: { in: storeIds },
        isActive: true,
        suspendedAt: null,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
      select: { storeId: true },
    });

    const map = new Map<string, { hasOffer: boolean; hasCoupon: boolean; badge: string | null }>();
    for (const id of storeIds) {
      map.set(id, { hasOffer: false, hasCoupon: false, badge: null });
    }
    for (const p of promos) {
      const cur = map.get(p.storeId)!;
      cur.hasOffer = true;
      cur.badge = this.offerBadge(p);
    }
    for (const c of coupons) {
      if (!c.storeId) continue;
      const cur = map.get(c.storeId)!;
      cur.hasCoupon = true;
    }
    return Object.fromEntries(map);
  }

  private async listPromotions(dto: ListPromotionsDto & { storeId: string }) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const now = new Date();
    const where: Prisma.StorePromotionWhereInput = {
      storeId: dto.storeId,
      ...(dto.q && { name: { contains: dto.q, mode: 'insensitive' } }),
      ...(dto.status === 'active' && {
        isActive: true,
        pausedAt: null,
        expiresAt: { gte: now },
      }),
      ...(dto.status === 'paused' && { pausedAt: { not: null } }),
      ...(dto.status === 'expired' && { expiresAt: { lt: now } }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.storePromotion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.storePromotion.count({ where }),
    ]);

    return {
      promotions: rows.map((p) => this.serializePromotion(p)),
      total,
      page,
      limit,
    };
  }

  private offerBadge(p: StorePromotion): string {
    switch (p.offerType) {
      case 'FREE_DELIVERY':
        return 'Free delivery';
      case 'PERCENTAGE_DISCOUNT':
      case 'COMBO':
        return `${Number(p.discountValue)}% off`;
      case 'FLAT_DISCOUNT':
        return `₹${Number(p.discountValue)} off`;
      case 'BUY_X_GET_Y':
        return `Buy ${p.buyQuantity ?? 2} Get ${p.getQuantity ?? 1}`;
      default:
        return 'Offer';
    }
  }

  private serializePromotion(p: StorePromotion) {
    return {
      id: p.id,
      storeId: p.storeId,
      name: p.name,
      description: p.description,
      offerType: p.offerType,
      target: p.target,
      categoryId: p.categoryId,
      productId: p.productId,
      discountValue: Number(p.discountValue),
      buyQuantity: p.buyQuantity,
      getQuantity: p.getQuantity,
      minOrderAmount: Number(p.minOrderAmount),
      maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : null,
      usageLimit: p.usageLimit,
      usedCount: p.usedCount,
      startsAt: p.startsAt.toISOString(),
      expiresAt: p.expiresAt.toISOString(),
      isActive: p.isActive,
      pausedAt: p.pausedAt?.toISOString() ?? null,
    };
  }

  private serializeCoupon(c: Coupon) {
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      type: c.type,
      kind: c.kind,
      scope: c.scope,
      sponsor: c.sponsor,
      storeId: c.storeId,
      discountValue: Number(c.discountValue),
      maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
      minOrderAmount: Number(c.minOrderAmount),
      usageLimit: c.usageLimit,
      usedCount: c.usedCount,
      perUserLimit: c.perUserLimit,
      firstOrderOnly: c.firstOrderOnly,
      startsAt: c.startsAt.toISOString(),
      expiresAt: c.expiresAt.toISOString(),
      isActive: c.isActive,
      suspendedAt: c.suspendedAt?.toISOString() ?? null,
    };
  }

  private async requirePromotion(storeId: string, id: string) {
    const p = await this.prisma.storePromotion.findFirst({ where: { id, storeId } });
    if (!p) throw new NotFoundException('Promotion not found');
    return p;
  }

  private async requireVisibleStore(slug: string) {
    const store = await this.prisma.store.findFirst({
      where: { slug, status: 'APPROVED', isActive: true, deletedAt: null },
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
