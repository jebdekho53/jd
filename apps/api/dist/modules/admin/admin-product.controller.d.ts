import { AdminProductService } from './admin-product.service';
export declare class AdminProductController {
    private readonly products;
    constructor(products: AdminProductService);
    detail(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            slug: string;
            brand: string | null;
            isActive: boolean;
            visibility: {
                buyerVisible: boolean;
                storeStatus: import("@prisma/client").$Enums.StoreStatus;
                storeActive: boolean;
            };
            metadata: {
                ingredients: string | null;
                shelfLife: string | null;
                countryOfOrigin: string | null;
                manufacturerName: string | null;
                manufacturerAddress: string | null;
                fssaiLicense: string | null;
                storageInstructions: string | null;
                disclaimer: string | null;
                taxInclusive: boolean;
            };
            tax: {
                hsnCode: string | null;
                hsnCodeId: string | null;
                hsnDescription: string | null;
                gstSlab: import("@prisma/client").$Enums.GstSlab | null;
                taxCategory: import("@prisma/client").$Enums.ProductTaxCategory;
            };
            inventory: {
                variantId: string;
                sku: string;
                name: string;
                price: number;
                availableQty: number;
                reservedQty: number;
                status: import("@prisma/client").$Enums.InventoryStatus | null;
            }[];
            reviews: {
                aggregate: {
                    ratingAvg: number;
                    ratingCount: number;
                };
                recent: {
                    id: string;
                    rating: number;
                    comment: string | null;
                    images: string[];
                    buyerName: string;
                    createdAt: string;
                }[];
            };
            offers: {
                storePromotions: {
                    id: string;
                    name: string;
                    offerType: import("@prisma/client").$Enums.PromotionOfferType;
                }[];
                coupons: {
                    id: string;
                    code: string;
                    name: string;
                }[];
                campaignOffers: {
                    id: string;
                    name: string;
                    kind: import("@prisma/client").$Enums.OfferKind;
                }[];
            };
            store: {
                id: string;
                name: string;
                slug: string;
                pincode: string;
            };
            merchant: {
                id: string;
                businessName: string;
                email: string | null;
                phone: string;
            } | null;
            category: {
                id: string;
                name: string;
                slug: string;
            } | null;
            pdpPreviewUrl: string;
        };
    }>;
}
