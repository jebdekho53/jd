import { RequestUser } from '../../common/types';
import { AdminCategoryGovernanceService } from './admin-category-governance.service';
import { CreateGlobalCategoryDto, ListCategoryRequestsDto, RejectCategoryRequestDto, RequestCategoryDocumentsDto, RevokeCategoryRejectionDto, UpdateGlobalCategoryDto, BulkCategoryRequestActionDto } from './dto/category-governance.dto';
export declare class AdminCategoryGovernanceController {
    private readonly service;
    constructor(service: AdminCategoryGovernanceService);
    listCategories(): Promise<{
        success: boolean;
        data: any;
    }>;
    createCategory(user: RequestUser, dto: CreateGlobalCategoryDto): Promise<{
        success: boolean;
        data: any;
    }>;
    updateCategory(user: RequestUser, id: string, dto: UpdateGlobalCategoryDto, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    deleteCategory(user: RequestUser, id: string, ip: string): Promise<{
        success: boolean;
        data: {
            id: string;
            deletedAt: Date;
            cascadedCount: any;
        };
    }>;
    getCategoryStatistics(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    listRequests(dto: ListCategoryRequestsDto): Promise<{
        success: boolean;
        data: any;
        meta: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getRequest(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    approve(user: RequestUser, id: string, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    reject(user: RequestUser, id: string, dto: RejectCategoryRequestDto, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    requestDocuments(user: RequestUser, id: string, dto: RequestCategoryDocumentsDto, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    revokeRejection(user: RequestUser, id: string, dto: RevokeCategoryRejectionDto, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    moveToReview(user: RequestUser, id: string, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    revokeApproval(user: RequestUser, id: string, dto: RejectCategoryRequestDto, ip: string): Promise<{
        success: boolean;
        data: any;
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
