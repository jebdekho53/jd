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
    primaryImageUrl?: string;
    supplementComplianceConfirmed?: boolean;
    lowStockThreshold?: number;
    manufacturerAddress?: string;
    disclaimer?: string;
    taxInclusive?: boolean;
    isReturnable?: boolean;
    isRefundable?: boolean;
    isReplaceable?: boolean;
    returnWindowHours?: number;
    approvalMode?: string;
    proofRequired?: string;
    refundMethod?: string;
    allowCustomerChangedMind?: boolean;
    returnPolicyText?: string;
    replacementPolicyText?: string;
    publish: boolean;
}
export declare class GenerateProductImageDto {
    mode?: 'bg_removal' | 'ai_edit';
}
export declare class ListAiHistoryDto {
    storeId?: string;
    page?: number;
    limit?: number;
}
