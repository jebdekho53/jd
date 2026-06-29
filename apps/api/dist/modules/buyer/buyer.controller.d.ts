import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { BuyerStoreService } from './buyer-store.service';
import { BuyerProductService } from './buyer-product.service';
import { DiscoverStoresDto } from './dto/discover-stores.dto';
import { StoreProductsDto } from './dto/store-products.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { CompareProductDto } from './dto/compare-product.dto';
export declare class BuyerController {
    private readonly storeService;
    private readonly productService;
    private readonly jwtService;
    private readonly logger;
    constructor(storeService: BuyerStoreService, productService: BuyerProductService, jwtService: JwtService);
    private optionalUserId;
    discoverStores(dto: DiscoverStoresDto): Promise<{
        success: boolean;
        data: import("./buyer-store.service").StoreCard[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getStore(slug: string): Promise<{
        success: boolean;
        data: import("./buyer-store.service").StoreDetail;
    }>;
    getStoreProducts(slug: string, dto: StoreProductsDto): Promise<{
        success: boolean;
        data: import("./buyer-product.service").BuyerProduct[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    compareProduct(productId: string, dto: CompareProductDto): Promise<{
        success: boolean;
        data: import("./compare-product.util").CompareProductResult;
    }>;
    searchProducts(dto: SearchProductsDto): Promise<{
        success: boolean;
        data: import("./buyer-product.service").BuyerProductWithStore[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    searchProductsGrouped(dto: SearchProductsDto): Promise<{
        success: boolean;
        data: import("./buyer-product.service").StoreSearchGroup[];
        meta: {
            total: number;
            storeCount: number;
        };
    }>;
    getProduct(id: string, storeSlug?: string): Promise<{
        success: boolean;
        data: import("./buyer-product.service").BuyerProductWithStore;
    }>;
    getProductOffers(id: string, req: Request): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    listCategoryStores(categoryId: string, dto: DiscoverStoresDto, subcategoryId?: string): Promise<{
        success: boolean;
        data: (import("./buyer-store.service").StoreCard & {
            productCount: number;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    listCategories(storeId?: string): Promise<{
        success: boolean;
        data: import("./buyer-product.service").CategoryItem[];
    }>;
}
