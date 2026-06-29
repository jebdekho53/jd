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
exports.AdminProductService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let AdminProductService = class AdminProductService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProductAudit(productId) {
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
        if (!product)
            throw new common_1.NotFoundException('Product not found');
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
        const buyerVisible = product.isActive &&
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
};
exports.AdminProductService = AdminProductService;
exports.AdminProductService = AdminProductService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminProductService);
//# sourceMappingURL=admin-product.service.js.map