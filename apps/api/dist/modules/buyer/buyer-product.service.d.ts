import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService } from './buyer-cache.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { CompareProductDto } from './dto/compare-product.dto';
import { StoreProductsDto } from './dto/store-products.dto';
import type { ReturnPolicySummary } from '../../common/utils/product-return-policy.util';
import { ConfigService } from '@nestjs/config';
export interface BuyerVariant {
    id: string;
    name: string;
    price: number;
    mrp: number | null;
    weightGrams: number | null;
    isDefault: boolean;
    availableQty: number;
}
export interface BuyerProductMetadata {
    ingredients: string | null;
    shelfLife: string | null;
    countryOfOrigin: string | null;
    manufacturerName: string | null;
    manufacturerAddress: string | null;
    fssaiLicense: string | null;
    hsnCode: string | null;
    taxInclusive: boolean;
    storageInstructions: string | null;
    disclaimer: string | null;
}
export interface BuyerProductReviewSummary {
    ratingAvg: number;
    ratingCount: number;
}
export interface BuyerProduct {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    brand: string | null;
    imageUrls: string[];
    basePrice: number;
    mrp: number | null;
    unit: string;
    isVeg: boolean | null;
    tags: string[];
    category: {
        id: string;
        name: string;
        slug: string;
    } | null;
    variants: BuyerVariant[];
    metadata?: BuyerProductMetadata;
    reviewSummary?: BuyerProductReviewSummary;
    returnPolicy?: ReturnPolicySummary;
}
export interface BuyerProductWithStore extends BuyerProduct {
    store: {
        id: string;
        name: string;
        slug: string;
        distanceKm?: number;
        ratingAvg?: number;
        ratingCount?: number;
        avgPrepTimeMins?: number;
        deliveryFee?: number;
        minOrderAmount?: number;
        deliveryPartner?: string;
    };
}
export interface StoreSearchGroup {
    store: {
        id: string;
        name: string;
        slug: string;
        distanceKm?: number;
        ratingAvg: number;
        avgPrepTimeMins: number;
    };
    products: BuyerProduct[];
    productCount: number;
}
export interface CategoryItem {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    parentId: string | null;
    sortOrder: number;
    children: CategoryItem[];
}
export declare class BuyerProductService {
    private readonly prisma;
    private readonly cache;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, cache: BuyerCacheService, configService: ConfigService);
    listStoreProducts(storeId: string, dto: StoreProductsDto): Promise<{
        products: BuyerProduct[];
        total: number;
    }>;
    getProductById(productId: string, storeSlug?: string): Promise<BuyerProductWithStore | null>;
    searchProducts(dto: SearchProductsDto): Promise<{
        products: BuyerProductWithStore[];
        total: number;
    }>;
    searchProductsGrouped(dto: SearchProductsDto): Promise<{
        groups: StoreSearchGroup[];
        total: number;
    }>;
    listCategories(storeId?: string): Promise<CategoryItem[]>;
    compareProduct(productId: string, dto: CompareProductDto): Promise<import("./compare-product.util").CompareProductResult | null>;
    getProductOffers(productId: string, userId?: string): Promise<{
        productId: string;
        storePromotions: {
            id: string;
            name: string;
            description: string | null;
            offerType: import("@prisma/client").$Enums.PromotionOfferType;
            badge: string;
        }[];
        campaignOffers: {
            id: string;
            name: string;
            description: string | null;
            kind: import("@prisma/client").$Enums.OfferKind;
            campaignName: string;
            minOrderAmount: number;
        }[];
        coupons: {
            id: string;
            code: string;
            name: string;
            minOrderAmount: number;
        }[];
        walletCashbackPercent: number | null;
        walletCashbackEligible: boolean;
        rewardPoints: number | null;
        firstOrderEligible: boolean;
        plusBenefits: string[];
        personalizedOffers: {
            id: string;
            name: string;
            description: string | null;
            kind: string;
        }[];
        freeDeliveryEligible: boolean;
    } | null>;
    private promotionBadge;
    private assertCategoryInCatalog;
    private activeOfferStoreIds;
    private sortScoredProducts;
}
