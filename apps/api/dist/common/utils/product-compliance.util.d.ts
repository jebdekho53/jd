export interface CategoryComplianceRef {
    slug: string;
    name: string;
}
export declare function categoryComplianceText(category: CategoryComplianceRef): string;
export declare function isHsnRequiredCategory(category: CategoryComplianceRef): boolean;
export declare function isFssaiRequiredCategory(category: CategoryComplianceRef): boolean;
export declare function isTaxComplianceCategory(category: CategoryComplianceRef, taxCategory: string): boolean;
export declare function isPublicProductImageUrl(url: string | null | undefined): boolean;
export interface ProductBuyerComplianceInput {
    imageUrls: string[];
    categoryId: string | null;
    category?: CategoryComplianceRef | null;
    hsnCodeId?: string | null;
    fssaiLicense?: string | null;
    taxCategory?: string | null;
    storeFssaiLicense?: string | null;
}
export declare function hasProductBuyerComplianceGaps(input: ProductBuyerComplianceInput): boolean;
