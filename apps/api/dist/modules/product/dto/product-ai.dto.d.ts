import { GstSlab } from '@prisma/client';
export declare class AnalyzeProductImageDto {
    dataUrl: string;
}
export declare class ConfirmAiProductDto {
    name: string;
    description?: string;
    brand?: string;
    sku?: string;
    categoryId?: string;
    basePrice: number;
    mrp?: number;
    unit?: string;
    quantity?: number;
    tags?: string[];
    ingredients?: string;
    shelfLife?: string;
    countryOfOrigin?: string;
    manufacturerName?: string;
    fssaiLicense?: string;
    storageInstructions?: string;
    hsnCodeId: string;
    gstSlab?: GstSlab;
    taxCategory?: 'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED';
    confirmReturnPolicy?: boolean;
    publish: boolean;
}
export declare class ListAiHistoryDto {
    storeId?: string;
    page?: number;
    limit?: number;
}
