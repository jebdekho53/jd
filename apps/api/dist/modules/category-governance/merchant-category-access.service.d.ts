import { PrismaService } from '../../database/prisma.service';
export type ApprovedCategoryTree = {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    parentId: string | null;
    sortOrder: number;
    children: ApprovedCategoryTree[];
};
export declare class MerchantCategoryAccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getApprovedCategoryIds(merchantProfileId: string): Promise<Set<string>>;
    assertCategoryApproved(merchantProfileId: string, categoryId: string): Promise<void>;
    assertProductCategoryAllowed(merchantProfileId: string, categoryId: string): Promise<void>;
    listApprovedCategoryTree(merchantProfileId: string): Promise<ApprovedCategoryTree[]>;
}
