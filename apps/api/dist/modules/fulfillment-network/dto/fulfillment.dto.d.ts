export declare class TransferItemDto {
    variantId: string;
    sku: string;
    quantity: number;
}
export declare class CreateTransferDto {
    fromStoreId: string;
    toStoreId: string;
    notes?: string;
    items: TransferItemDto[];
}
export declare class NetworkQueryDto {
    storeId?: string;
}
