import { AdminMediaService } from './admin-media.service';
export declare class AdminMediaController {
    private readonly media;
    constructor(media: AdminMediaService);
    coverage(): Promise<{
        success: boolean;
        data: {
            totals: {
                productsWithoutImages: number;
                storesWithoutLogo: number;
                storesWithoutBanner: number;
                categoriesWithoutImages: number;
            };
            samples: {
                products: {
                    store: {
                        name: string;
                    };
                    id: string;
                    name: string;
                    storeId: string;
                    isActive: boolean;
                }[];
                storesMissingLogo: {
                    id: string;
                    status: import("@prisma/client").$Enums.StoreStatus;
                    name: string;
                }[];
                storesMissingBanner: {
                    id: string;
                    status: import("@prisma/client").$Enums.StoreStatus;
                    name: string;
                }[];
                categories: {
                    id: string;
                    name: string;
                    isActive: boolean;
                    parentId: string | null;
                    parent: {
                        name: string;
                    } | null;
                }[];
            };
        };
    }>;
}
