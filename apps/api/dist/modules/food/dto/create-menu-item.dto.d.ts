import { DietType, SpiceLevel } from '@prisma/client';
export declare class MenuItemVariantDto {
    name: string;
    price: number;
    isDefault?: boolean;
}
export declare class CreateMenuItemDto {
    categoryId: string;
    name: string;
    slug?: string;
    description?: string;
    imageUrls?: string[];
    basePrice: number;
    mrp?: number;
    dietType?: DietType;
    spiceLevel?: SpiceLevel;
    prepTimeMins?: number;
    servingSize?: string;
    cuisineName?: string;
    allowsSpecialInstructions?: boolean;
    sortOrder?: number;
    variants?: MenuItemVariantDto[];
}
