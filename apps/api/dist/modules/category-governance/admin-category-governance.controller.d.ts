import { RequestUser } from '../../common/types';
import { AdminCategoryGovernanceService } from './admin-category-governance.service';
import { CreateGlobalCategoryDto, ListCategoryRequestsDto, RejectCategoryRequestDto, RequestCategoryDocumentsDto, RevokeCategoryRejectionDto, UpdateGlobalCategoryDto, BulkCategoryRequestActionDto } from './dto/category-governance.dto';
export declare class AdminCategoryGovernanceController {
    private readonly service;
    constructor(service: AdminCategoryGovernanceService);
    listCategories(): Promise<{
        success: boolean;
        data: ({
            children: {
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
        })[];
    }>;
    createCategory(user: RequestUser, dto: CreateGlobalCategoryDto): Promise<{
        success: boolean;
        data: {
            children: {
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
    }>;
    updateCategory(user: RequestUser, id: string, dto: UpdateGlobalCategoryDto, ip: string): Promise<{
        success: boolean;
        data: {
            children: {
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
    }>;
    deleteCategory(user: RequestUser, id: string, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            deletedAt: Date;
            cascadedCount: number;
        };
    }>;
    getCategoryStatistics(): Promise<{
        success: boolean;
        data: {
            totalCategories: number;
            totalSubcategories: number;
            pendingRequests: number;
            underReviewRequests: number;
            approvedRequests: number;
            rejectedRequests: number;
            revokedRequests: number;
            documentsRequiredRequests: number;
            topCategories: {
                categoryId: string | null;
                name: string;
                productCount: number;
            }[];
            storesPerCategory: {
                categoryId: string;
                name: string;
                storeCount: number;
            }[];
        };
    }>;
    listRequests(dto: ListCategoryRequestsDto): Promise<{
        success: boolean;
        data: ({
            store: {
                merchantProfile: {
                    user: {
                        phone: string;
                        email: string | null;
                        id: string;
                    };
                    id: string;
                    businessName: string;
                    gstNumber: string | null;
                };
                id: string;
                name: string;
                slug: string;
            };
            category: {
                id: string;
                name: string;
                slug: string;
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
                slug: string;
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
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getRequest(id: string): Promise<{
        success: boolean;
        data: {
            store: {
                merchantProfile: {
                    user: {
                        phone: string;
                        email: string | null;
                        id: string;
                    };
                    id: string;
                    businessName: string;
                    gstNumber: string | null;
                    panNumber: string | null;
                };
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
        };
    }>;
    approve(user: RequestUser, id: string, ip: string): Promise<{
        success: boolean;
        data: {
            store: {
                id: string;
                name: string;
                slug: string;
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
    reject(user: RequestUser, id: string, dto: RejectCategoryRequestDto, ip: string): Promise<{
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
    requestDocuments(user: RequestUser, id: string, dto: RequestCategoryDocumentsDto, ip: string): Promise<{
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
    revokeRejection(user: RequestUser, id: string, dto: RevokeCategoryRejectionDto, ip: string): Promise<{
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
    moveToReview(user: RequestUser, id: string, ip: string): Promise<{
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
    revokeApproval(user: RequestUser, id: string, dto: RejectCategoryRequestDto, ip: string): Promise<{
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
    bulkAction(user: RequestUser, dto: BulkCategoryRequestActionDto, ip: string): Promise<{
        success: boolean;
        data: {
            results: {
                id: string;
                ok: boolean;
                error?: string;
            }[];
            succeeded: number;
            failed: number;
        };
    }>;
}
