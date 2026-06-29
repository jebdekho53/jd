import { MenuCategorySlug } from '@prisma/client';
export declare class CreateMenuCategoryDto {
    platformCategoryId: string;
    name?: string;
    slug?: string;
    categorySlug?: MenuCategorySlug;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
}
