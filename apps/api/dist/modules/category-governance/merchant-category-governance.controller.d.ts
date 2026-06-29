import { CategoryCatalogKind } from '@prisma/client';
import { RequestUser } from '../../common/types';
import { MerchantCategoryRequestService } from './merchant-category-request.service';
import { RequestCategoryAccessDto, RequestStoreCategoryAccessDto, UploadCategoryDocumentDto } from './dto/category-governance.dto';
import { StoreCategoryRequestService } from './store-category-request.service';
export declare class MerchantCategoryGovernanceController {
    private readonly legacyService;
    private readonly storeCategoryService;
    constructor(legacyService: MerchantCategoryRequestService, storeCategoryService: StoreCategoryRequestService);
    listStoreCatalog(user: RequestUser, storeId: string, catalogKind?: CategoryCatalogKind): Promise<{
        success: boolean;
        data: {
            children: {
                requestStatus: import("@prisma/client").$Enums.StoreCategoryRequestStatus | null;
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            }[];
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            storeId: string | null;
            scope: import("@prisma/client").$Enums.CategoryScope;
            isActive: boolean;
            slug: string;
            sortOrder: number;
            parentId: string | null;
            icon: string | null;
            imageUrl: string | null;
            catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
        }[];
    }>;
    listStoreRequests(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: ({
            store: {
                id: string;
                name: string;
                slug: string;
            };
            category: {
                id: string;
                name: string;
                slug: string;
            };
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.StoreDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                uploadedBy: string;
                storeCategoryRequestId: string;
            }[];
            subcategory: {
                id: string;
                name: string;
                slug: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.StoreCategoryRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            reason: string | null;
            storeId: string;
            categoryId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            subcategoryId: string;
            adminNote: string | null;
        })[];
    }>;
    listStoreApproved(user: RequestUser, storeId: string, catalogKind?: CategoryCatalogKind): Promise<{
        success: boolean;
        data: import("./store-category-access.service").ApprovedCategoryTree[];
    }>;
    listStoreApprovedMenuCategories(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: import("./store-category-access.service").ApprovedCategoryTree[];
    }>;
    requestStoreAccess(user: RequestUser, storeId: string, dto: RequestStoreCategoryAccessDto, ip: string): Promise<{
        success: boolean;
        data: {
            store: {
                id: string;
                name: string;
            };
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
            subcategory: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.StoreCategoryRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            reason: string | null;
            storeId: string;
            categoryId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            subcategoryId: string;
            adminNote: string | null;
        };
    }>;
    uploadStoreDocument(user: RequestUser, storeId: string, id: string, dto: UploadCategoryDocumentDto, ip: string): Promise<{
        success: boolean;
        data: ({
            store: {
                id: string;
                name: string;
            };
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.StoreDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                uploadedBy: string;
                storeCategoryRequestId: string;
            }[];
            subcategory: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.StoreCategoryRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            reason: string | null;
            storeId: string;
            categoryId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            subcategoryId: string;
            adminNote: string | null;
        }) | null;
    }>;
    submitStoreDocuments(user: RequestUser, storeId: string, id: string, ip: string): Promise<{
        success: boolean;
        data: {
            store: {
                id: string;
                name: string;
            };
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.StoreDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                uploadedBy: string;
                storeCategoryRequestId: string;
            }[];
            subcategory: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.StoreCategoryRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            reason: string | null;
            storeId: string;
            categoryId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            subcategoryId: string;
            adminNote: string | null;
        };
    }>;
    listCatalog(user: RequestUser, storeId?: string, catalogKind?: CategoryCatalogKind): Promise<{
        success: boolean;
        data: {
            children: {
                requestStatus: import("@prisma/client").$Enums.StoreCategoryRequestStatus | null;
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            }[];
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            storeId: string | null;
            scope: import("@prisma/client").$Enums.CategoryScope;
            isActive: boolean;
            slug: string;
            sortOrder: number;
            parentId: string | null;
            icon: string | null;
            imageUrl: string | null;
            catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
        }[];
    }>;
    listMyRequests(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: ({
            store: {
                id: string;
                name: string;
                slug: string;
            };
            category: {
                id: string;
                name: string;
                slug: string;
            };
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.StoreDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                uploadedBy: string;
                storeCategoryRequestId: string;
            }[];
            subcategory: {
                id: string;
                name: string;
                slug: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.StoreCategoryRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            reason: string | null;
            storeId: string;
            categoryId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            subcategoryId: string;
            adminNote: string | null;
        })[];
    } | {
        success: boolean;
        data: ({
            category: {
                parent: {
                    id: string;
                    name: string;
                    slug: string;
                } | null;
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.StoreDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                uploadedBy: string;
                merchantCategoryId: string;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.MerchantCategoryStatus;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            requestNote: string | null;
        })[];
    }>;
    listApproved(user: RequestUser, storeId: string, catalogKind?: CategoryCatalogKind): Promise<{
        success: boolean;
        data: import("./merchant-category-access.service").ApprovedCategoryTree[];
    }>;
    requestAccess(user: RequestUser, dto: RequestCategoryAccessDto, ip: string, storeId?: string): Promise<{
        success: boolean;
        data: {
            store: {
                id: string;
                name: string;
            };
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
            subcategory: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.StoreCategoryRequestStatus;
            createdAt: Date;
            updatedAt: Date;
            reason: string | null;
            storeId: string;
            categoryId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            subcategoryId: string;
            adminNote: string | null;
        };
    } | {
        success: boolean;
        data: {
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.MerchantCategoryStatus;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            requestNote: string | null;
        };
    }>;
    uploadDocument(user: RequestUser, id: string, dto: UploadCategoryDocumentDto, ip: string): Promise<{
        success: boolean;
        data: ({
            category: {
                parent: {
                    id: string;
                    name: string;
                    slug: string;
                } | null;
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.StoreDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                uploadedBy: string;
                merchantCategoryId: string;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.MerchantCategoryStatus;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            requestNote: string | null;
        }) | null;
    }>;
    submitDocuments(user: RequestUser, id: string, ip: string): Promise<{
        success: boolean;
        data: {
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                description: string | null;
                storeId: string | null;
                scope: import("@prisma/client").$Enums.CategoryScope;
                isActive: boolean;
                slug: string;
                sortOrder: number;
                parentId: string | null;
                icon: string | null;
                imageUrl: string | null;
                catalogKind: import("@prisma/client").$Enums.CategoryCatalogKind;
            };
            documents: {
                id: string;
                documentType: import("@prisma/client").$Enums.StoreDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
                uploadedBy: string;
                merchantCategoryId: string;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.MerchantCategoryStatus;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            requestNote: string | null;
        };
    }>;
}
