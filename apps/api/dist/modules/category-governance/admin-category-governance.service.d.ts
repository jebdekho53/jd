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
    listGlobalCategories(): Promise<any>;
    getGlobalCategory(categoryId: string): Promise<any>;
    createGlobalCategory(dto: CreateGlobalCategoryDto, adminUserId: string): Promise<any>;
    updateGlobalCategory(categoryId: string, dto: UpdateGlobalCategoryDto, adminUserId: string): Promise<any>;
    softDeleteGlobalCategory(categoryId: string, adminUserId: string): Promise<{
        id: string;
        deletedAt: Date;
        cascadedCount: any;
    }>;
    listCategoryRequests(dto: ListCategoryRequestsDto): Promise<{
        requests: any;
        total: any;
    }>;
    getCategoryRequest(requestId: string): Promise<any>;
    approveCategoryRequest(requestId: string, adminUserId: string, ipAddress?: string): Promise<any>;
    rejectCategoryRequest(requestId: string, adminUserId: string, dto: RejectCategoryRequestDto, ipAddress?: string): Promise<any>;
    requestCategoryDocuments(requestId: string, adminUserId: string, dto: RequestCategoryDocumentsDto, ipAddress?: string): Promise<any>;
    moveCategoryRequestToReview(requestId: string, adminUserId: string, ipAddress?: string): Promise<any>;
    revokeCategoryApproval(requestId: string, adminUserId: string, dto: RejectCategoryRequestDto, ipAddress?: string): Promise<any>;
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
    revokeCategoryRejection(requestId: string, adminUserId: string, dto: RevokeCategoryRejectionDto, ipAddress?: string): Promise<any>;
    getCategoryStatistics(): Promise<{
        totalCategories: any;
        totalSubcategories: any;
        pendingRequests: any;
        underReviewRequests: any;
        approvedRequests: any;
        rejectedRequests: any;
        revokedRequests: any;
        documentsRequiredRequests: any;
        topCategories: any;
        storesPerCategory: any;
    }>;
    private findStoreRequestOrThrow;
    private emitCatalogEvent;
    private emitStoreGovernanceEvent;
    private invalidateBuyerCategoryCache;
    private invalidateCategoryCaches;
    private toSlug;
}
