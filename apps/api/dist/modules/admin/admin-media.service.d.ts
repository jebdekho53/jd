import { PrismaService } from '../../database/prisma.service';
export declare class AdminMediaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCoverageReport(): Promise<{
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
    }>;
}
