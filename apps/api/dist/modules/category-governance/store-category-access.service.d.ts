import { CategoryCatalogKind } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export type ApprovedCategoryTree = {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    icon: string | null;
    parentId: string | null;
    sortOrder: number;
    children: ApprovedCategoryTree[];
};
export declare class StoreCategoryAccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assertMenuSubcategoryApproved(storeId: string, merchantProfileId: string, platformSubcategoryId: string): Promise<{
        parentId: string;
        subcategoryId: string;
        slug: string;
        name: string;
    }>;
    assertProductCategoryAllowed(storeId: string, merchantProfileId: string, categoryId: string): Promise<void>;
    private assertSubcategoryApproved;
    private assertParentOrLegacyApproved;
    listApprovedCategoryTree(storeId: string, catalogKind?: CategoryCatalogKind): Promise<ApprovedCategoryTree[]>;
}
