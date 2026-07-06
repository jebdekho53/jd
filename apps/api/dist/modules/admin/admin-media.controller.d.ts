import { AdminMediaService } from './admin-media.service';
export declare class AdminMediaController {
    private readonly media;
    constructor(media: AdminMediaService);
    coverage(): Promise<{
        success: boolean;
        data: {
            totals: {
                productsWithoutImages: any;
                storesWithoutLogo: any;
                storesWithoutBanner: any;
                categoriesWithoutImages: any;
            };
            samples: {
                products: any;
                storesMissingLogo: any;
                storesMissingBanner: any;
                categories: any;
            };
        };
    }>;
}
