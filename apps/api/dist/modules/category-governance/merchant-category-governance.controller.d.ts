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
        data: any;
    }>;
    listStoreRequests(user: RequestUser, storeId: string): Promise<{
        success: boolean;
        data: any;
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
        data: any;
    }>;
    uploadStoreDocument(user: RequestUser, storeId: string, id: string, dto: UploadCategoryDocumentDto, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    submitStoreDocuments(user: RequestUser, storeId: string, id: string, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    listCatalog(user: RequestUser, storeId?: string, catalogKind?: CategoryCatalogKind): Promise<{
        success: boolean;
        data: any;
    }>;
    listMyRequests(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    listApproved(user: RequestUser, storeId: string, catalogKind?: CategoryCatalogKind): Promise<{
        success: boolean;
        data: import("./merchant-category-access.service").ApprovedCategoryTree[];
    }>;
    requestAccess(user: RequestUser, dto: RequestCategoryAccessDto, ip: string, storeId?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    uploadDocument(user: RequestUser, id: string, dto: UploadCategoryDocumentDto, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
    submitDocuments(user: RequestUser, id: string, ip: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
