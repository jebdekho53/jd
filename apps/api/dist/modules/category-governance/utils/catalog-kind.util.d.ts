import { CategoryCatalogKind, StoreBusinessTypeStatus, VerticalBusinessType } from '@prisma/client';
export declare function catalogKindForStoreBusinessTypes(businessTypes: VerticalBusinessType[]): CategoryCatalogKind;
export declare function resolveStoreCatalogKind(prisma: {
    storeBusinessType: {
        findMany: (args: {
            where: {
                storeId: string;
                status?: StoreBusinessTypeStatus;
            };
            select: {
                businessType: true;
            };
        }) => Promise<Array<{
            businessType: VerticalBusinessType;
        }>>;
    };
}, storeId: string, explicit?: CategoryCatalogKind): Promise<CategoryCatalogKind>;
