export interface CategoryComplianceRef {
    slug: string;
    name: string;
}
export declare function categoryComplianceText(category: CategoryComplianceRef): string;
export declare function isHsnRequiredCategory(category: CategoryComplianceRef): boolean;
export declare function isFssaiRequiredCategory(category: CategoryComplianceRef): boolean;
export declare function isTaxComplianceCategory(category: CategoryComplianceRef, taxCategory: string): boolean;
