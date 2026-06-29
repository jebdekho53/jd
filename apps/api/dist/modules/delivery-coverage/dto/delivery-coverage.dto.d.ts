export declare class AddDeliveryAreaDto {
    pincode: string;
    deliveryFee?: number;
    minimumOrder?: number;
    estimatedMinutes?: number;
    priority?: number;
}
export declare class BulkAddDeliveryAreasDto {
    pincodes: string[];
}
export declare class UpdateDeliveryAreaDto {
    deliveryFee?: number;
    minimumOrder?: number;
    estimatedMinutes?: number;
    priority?: number;
    isActive?: boolean;
}
export declare class ListDeliveryAreasDto {
    search?: string;
    page?: number;
    limit?: number;
}
export declare class AdminCoverageSearchDto {
    pincode?: string;
    city?: string;
    page?: number;
    limit?: number;
}
export declare class CsvImportRowDto {
    pincode: string;
    deliveryFee?: number;
    minimumOrder?: number;
    estimatedMinutes?: number;
    priority?: number;
}
