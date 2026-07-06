import { AdminProductService } from './admin-product.service';
export declare class AdminProductController {
    private readonly products;
    constructor(products: AdminProductService);
    detail(id: string): Promise<{
        success: boolean;
        data: {
            id: any;
            name: any;
            slug: any;
            brand: any;
            isActive: any;
            visibility: {
                buyerVisible: any;
                storeStatus: any;
                storeActive: any;
            };
            metadata: {
                ingredients: any;
                shelfLife: any;
                countryOfOrigin: any;
                manufacturerName: any;
                manufacturerAddress: any;
                fssaiLicense: any;
                storageInstructions: any;
                disclaimer: any;
                taxInclusive: any;
            };
            tax: {
                hsnCode: any;
                hsnCodeId: any;
                hsnDescription: any;
                gstSlab: any;
                taxCategory: any;
            };
            inventory: any;
            reviews: {
                aggregate: {
                    ratingAvg: any;
                    ratingCount: any;
                };
                recent: any;
            };
            offers: {
                storePromotions: any;
                coupons: any;
                campaignOffers: any;
            };
            store: {
                id: any;
                name: any;
                slug: any;
                pincode: any;
            };
            merchant: {
                id: any;
                businessName: any;
                email: any;
                phone: any;
            } | null;
            category: any;
            pdpPreviewUrl: string;
        };
    }>;
}
