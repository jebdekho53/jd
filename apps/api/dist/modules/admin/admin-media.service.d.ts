import { PrismaService } from '../../database/prisma.service';
export declare class AdminMediaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCoverageReport(): Promise<{
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
    }>;
}
