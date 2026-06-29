import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { CategoryItem } from './buyer-product.service';
export type CategoryGrantScope = {
    parentCategoryId: string;
    subcategoryIds: string[];
};
export declare const ACTIVE_GLOBAL_CATEGORY_WHERE: Prisma.CategoryWhereInput;
export declare function resolveCategoryGrantScope(prisma: PrismaService, categoryId: string, explicitSubcategoryId?: string): Promise<CategoryGrantScope | null>;
export declare function fetchActiveGlobalCategories(prisma: PrismaService): Promise<CategoryItem[]>;
export declare function fetchStoreVisibleCategories(prisma: PrismaService, storeId: string): Promise<CategoryItem[]>;
export declare function fetchApprovedSubcategoryIds(prisma: PrismaService, storeId: string): Promise<string[]>;
export declare function fetchStoresForCategory(prisma: PrismaService, categoryId: string, subcategoryId?: string): Promise<{
    storeId: string;
    productCount: number;
}[]>;
export declare function assertActiveGlobalCategory(prisma: PrismaService, categoryId: string): Promise<void>;
