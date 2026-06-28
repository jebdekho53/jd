import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminProductService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductAudit(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        hsnCodeRef: { select: { id: true, code: true, description: true, defaultGstSlab: true } },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            isActive: true,
            pincode: true,
            merchantProfile: {
              select: {
                id: true,
                businessName: true,
                user: { select: { id: true, email: true, phone: true } },
              },
            },
          },
        },
        variants: {
          include: { inventory: true },
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        },
        productReviews: {
          where: { status: 'VISIBLE' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { buyerProfile: { select: { name: true } } },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    const now = new Date();
    const [promotions, coupons, offers, reviewAgg] = await Promise.all([
      this.prisma.storePromotion.findMany({
        where: { storeId: product.storeId, isActive: true, expiresAt: { gte: now } },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coupon.findMany({
        where: {
          OR: [{ storeId: product.storeId }, { scope: 'PLATFORM' }],
          isActive: true,
          expiresAt: { gte: now },
        },
        take: 10,
      }),
      this.prisma.offer.findMany({
        where: {
          OR: [{ storeId: product.storeId }, { productId: product.id }],
          isActive: true,
          expiresAt: { gte: now },
        },
        take: 10,
      }),
      this.prisma.productReview.aggregate({
        where: { productId, status: 'VISIBLE' },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    const buyerVisible =
      product.isActive &&
      !product.deletedAt &&
      product.store.status === 'APPROVED' &&
      product.store.isActive;

    const siteUrl = process.env.BUYER_WEB_URL ?? 'https://jebdekho.com';
    const pdpPreviewUrl = `${siteUrl}/products/${product.id}?store=${product.store.slug}`;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      isActive: product.isActive,
      visibility: {
        buyerVisible,
        storeStatus: product.store.status,
        storeActive: product.store.isActive,
      },
      metadata: {
        ingredients: product.ingredients,
        shelfLife: product.shelfLife,
        countryOfOrigin: product.countryOfOrigin,
        manufacturerName: product.manufacturerName,
        manufacturerAddress: product.manufacturerAddress,
        fssaiLicense: product.fssaiLicense,
        storageInstructions: product.storageInstructions,
        disclaimer: product.disclaimer,
        taxInclusive: product.taxInclusive,
      },
      tax: {
        hsnCode: product.hsnCodeRef?.code ?? null,
        hsnCodeId: product.hsnCodeId,
        hsnDescription: product.hsnCodeRef?.description ?? null,
        gstSlab: product.gstSlab,
        taxCategory: product.taxCategory,
      },
      inventory: product.variants.map((v) => ({
        variantId: v.id,
        sku: v.sku,
        name: v.name,
        price: Number(v.price),
        availableQty: v.inventory?.availableQty ?? 0,
        reservedQty: v.inventory?.reservedQty ?? 0,
        status: v.inventory?.status ?? null,
      })),
      reviews: {
        aggregate: {
          ratingAvg: reviewAgg._avg.rating ?? 0,
          ratingCount: reviewAgg._count.id,
        },
        recent: product.productReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          images: r.images,
          buyerName: r.buyerProfile.name,
          createdAt: r.createdAt.toISOString(),
        })),
      },
      offers: {
        storePromotions: promotions.map((p) => ({ id: p.id, name: p.name, offerType: p.offerType })),
        coupons: coupons.map((c) => ({ id: c.id, code: c.code, name: c.name })),
        campaignOffers: offers.map((o) => ({ id: o.id, name: o.name, kind: o.kind })),
      },
      store: {
        id: product.store.id,
        name: product.store.name,
        slug: product.store.slug,
        pincode: product.store.pincode,
      },
      merchant: product.store.merchantProfile
        ? {
            id: product.store.merchantProfile.id,
            businessName: product.store.merchantProfile.businessName,
            email: product.store.merchantProfile.user.email,
            phone: product.store.merchantProfile.user.phone,
          }
        : null,
      category: product.category,
      pdpPreviewUrl,
    };
  }
}
