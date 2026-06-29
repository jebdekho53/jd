import { CategoryCatalogKind, StoreCategoryRequestStatus, StoreDocumentType } from '@prisma/client';
export declare class CreateGlobalCategoryDto {
    name: string;
    parentId?: string;
    imageUrl: string;
    icon?: string;
    description?: string;
    sortOrder?: number;
    catalogKind?: CategoryCatalogKind;
}
export declare class UpdateGlobalCategoryDto {
    name?: string;
    imageUrl?: string;
    icon?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
    catalogKind?: CategoryCatalogKind;
}
export declare class RequestStoreCategoryAccessDto {
    categoryId: string;
    subcategoryId: string;
    reason?: string;
}
export declare class RequestCategoryAccessDto {
    categoryId: string;
    requestNote?: string;
}
export declare class UploadCategoryDocumentDto {
    documentType: StoreDocumentType;
    fileName: string;
    fileUrl: string;
    mimeType: string;
}
export declare class RejectCategoryRequestDto {
    reason: string;
}
export declare class RequestCategoryDocumentsDto {
    reason: string;
    documentTypes?: StoreDocumentType[];
}
export declare class RevokeCategoryRejectionDto {
    reason: string;
}
export declare class ListCategoryRequestsDto {
    status?: StoreCategoryRequestStatus;
    storeId?: string;
    page?: number;
    limit?: number;
}
export declare class BulkCategoryRequestActionDto {
    requestIds: string[];
    action: 'approve' | 'reject' | 'request-documents' | 'move-to-review';
    reason?: string;
    documentTypes?: StoreDocumentType[];
}
