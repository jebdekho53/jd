import { StoreDocumentType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { CreateGlobalCategoryDto, ListCategoryRequestsDto, RejectCategoryRequestDto, RequestCategoryDocumentsDto, RevokeCategoryRejectionDto, UpdateGlobalCategoryDto } from './dto/category-governance.dto';
export declare class AdminCategoryGovernanceService {
    private readonly prisma;
    private readonly audit;
    private readonly domainEvents;
    private readonly buyerCache;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditService, domainEvents: DomainEventsService, buyerCache: BuyerCacheService);
    listGlobalCategories(): Promise<({
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
    })[]>;
    getGlobalCategory(categoryId: string): Promise<{
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
    }>;
    createGlobalCategory(dto: CreateGlobalCategoryDto, adminUserId: string): Promise<{
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
    }>;
    updateGlobalCategory(categoryId: string, dto: UpdateGlobalCategoryDto, adminUserId: string): Promise<{
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
    }>;
    softDeleteGlobalCategory(categoryId: string, adminUserId: string): Promise<{
        id: string;
        deletedAt: Date;
        cascadedCount: number;
    }>;
    listCategoryRequests(dto: ListCategoryRequestsDto): Promise<{
        requests: ({
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
        total: number;
    }>;
    getCategoryRequest(requestId: string): Promise<{
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
    }>;
    approveCategoryRequest(requestId: string, adminUserId: string, ipAddress?: string): Promise<{
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
    }>;
    rejectCategoryRequest(requestId: string, adminUserId: string, dto: RejectCategoryRequestDto, ipAddress?: string): Promise<{
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
    }>;
    requestCategoryDocuments(requestId: string, adminUserId: string, dto: RequestCategoryDocumentsDto, ipAddress?: string): Promise<{
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
    }>;
    moveCategoryRequestToReview(requestId: string, adminUserId: string, ipAddress?: string): Promise<{
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
    }>;
    revokeCategoryApproval(requestId: string, adminUserId: string, dto: RejectCategoryRequestDto, ipAddress?: string): Promise<{
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
    }>;
    bulkCategoryRequestAction(requestIds: string[], action: 'approve' | 'reject' | 'request-documents' | 'move-to-review', adminUserId: string, payload: {
        reason?: string;
        documentTypes?: StoreDocumentType[];
    }, ipAddress?: string): Promise<{
        results: {
            id: string;
            ok: boolean;
            error?: string;
        }[];
        succeeded: number;
        failed: number;
    }>;
    revokeCategoryRejection(requestId: string, adminUserId: string, dto: RevokeCategoryRejectionDto, ipAddress?: string): Promise<{
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
    }>;
    getCategoryStatistics(): Promise<{
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
    }>;
    private findStoreRequestOrThrow;
    private emitCatalogEvent;
    private emitStoreGovernanceEvent;
    private invalidateBuyerCategoryCache;
    private invalidateCategoryCaches;
    private toSlug;
}
