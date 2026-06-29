import { Category } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { StoreCategoryAccessService } from '../category-governance/store-category-access.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
export declare class CategoryService {
    private readonly prisma;
    private readonly merchantService;
    private readonly storeCategoryAccess;
    private readonly logger;
    constructor(prisma: PrismaService, merchantService: MerchantService, storeCategoryAccess: StoreCategoryAccessService);
    listCategories(storeId: string, userId: string): Promise<Category[]>;
    createCategory(userId: string, storeId: string, dto: CreateCategoryDto): Promise<Category>;
    updateCategory(userId: string, storeId: string, categoryId: string, dto: UpdateCategoryDto): Promise<Category>;
    private verifyStoreOwnership;
    private toSlug;
}
