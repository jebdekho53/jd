import { PrismaService } from '../../database/prisma.service';
export interface StoreProductIndex {
    bySku: Map<string, {
        id: string;
        name: string;
    }>;
    byIdentity: Map<string, {
        id: string;
        name: string;
    }>;
}
export interface DuplicateMatch {
    type: 'sku' | 'identity';
    existingProductId: string;
    existingProductName: string;
    message: string;
}
export declare class ProductDuplicateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    loadStoreProductIndex(storeId: string): Promise<StoreProductIndex>;
    checkDuplicate(index: StoreProductIndex, input: {
        sku?: string;
        name: string;
        brand?: string;
        unit?: string;
    }): DuplicateMatch | null;
    identityKey(name: string, brand?: string | null, unit?: string | null): string;
    private norm;
}
