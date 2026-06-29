export declare enum UploadImagePurpose {
    PRODUCT = "product",
    STORE_LOGO = "store-logo",
    STORE_BANNER = "store-banner",
    CATEGORY = "category",
    REVIEW = "review",
    AI_PRODUCT = "ai-product"
}
export declare class UploadImageDto {
    dataUrl: string;
    purpose: UploadImagePurpose;
}
