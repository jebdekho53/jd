export declare class ListStoreInventoryDto {
    search?: string;
    categoryId?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    page?: number;
    limit?: number;
}
export declare class ListAdminInventoryDto {
    storeId?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    page?: number;
    limit?: number;
}
export declare class BulkAdjustInventoryDto {
    variantIds: string[];
    availableQty: number;
}
