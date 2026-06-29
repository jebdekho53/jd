export declare class ProcurementQueryDto {
    storeId?: string;
    q?: string;
    vendorType?: string;
    moqMax?: number;
    gstRate?: string;
}
export declare class AddCartItemDto {
    vendorProductId: string;
    quantity: number;
}
export declare class UpdateCartDto {
    items: AddCartItemDto[];
    vendorId?: string;
    storeId?: string;
}
export declare class CreateVendorOrderDto {
    storeId?: string;
    notes?: string;
    useCredit?: boolean;
}
export declare class CreateVendorProductDto {
    catalogId: string;
    name: string;
    sku: string;
    description?: string;
    category?: string;
    hsnCode?: string;
    gstRate?: number;
    basePrice: number;
    moq?: number;
    leadTimeDays?: number;
    availableQty?: number;
}
export declare class ShipVendorOrderDto {
    carrier?: string;
    trackingNumber?: string;
}
