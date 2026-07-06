import { Body } from '@nestjs/common';
import { Request } from 'express';
import { RequestUser } from '../../common/types';
import { AdminStoreService } from './admin-store.service';
import { ListStoreApprovalsDto } from './dto/list-store-approvals.dto';
import { RejectStoreDto } from './dto/reject-store.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';
import { RevokeRejectionDto } from './dto/revoke-rejection.dto';
import { SuspendStoreDto } from './dto/suspend-store.dto';
import { DeleteStoreDto } from './dto/delete-store.dto';
export declare class AdminStoreController {
    private readonly adminStoreService;
    constructor(adminStoreService: AdminStoreService);
    listApprovals(query: ListStoreApprovalsDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            slug: string;
            status: Body;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            rejectionReason: string | null;
            rejectionType: Body | null;
            reviewedBy: string | null;
            documentRequestReason: string | null;
            documentRequestAt: Date | null;
            requestedDocumentTypes: unknown;
            cityId: string;
            pincode: string;
            line1: string;
            createdAt: Date;
            merchantProfile: {
                id: string;
                businessName: string;
                gstNumber: string | null;
                kycStatus: string;
                isBlacklisted: boolean;
                blacklistReason: string | null;
                user: {
                    id: string;
                    phone: string;
                    email: string | null;
                };
            };
            _count: {
                products: number;
                orders: number;
            };
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getStoreDetail(storeId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    approveStore(user: RequestUser, storeId: string, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: Body;
            isActive: boolean;
            reviewedAt: Date | null;
        };
    }>;
    requestDocuments(user: RequestUser, storeId: string, dto: RequestDocumentsDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: Body;
            documentRequestReason: string | null;
            requestedDocumentTypes: unknown;
        };
    }>;
    rejectStore(user: RequestUser, storeId: string, dto: RejectStoreDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: Body;
            rejectionReason: string | null;
            rejectionType: Body | null;
        };
    }>;
    revokeRejection(user: RequestUser, storeId: string, dto: RevokeRejectionDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: Body;
        };
    }>;
    suspendStore(user: RequestUser, storeId: string, dto: SuspendStoreDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: Body;
            isActive: boolean;
        };
    }>;
    reinstateStore(user: RequestUser, storeId: string, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: Body;
            isActive: boolean;
        };
    }>;
    deleteStore(user: RequestUser, storeId: string, dto: DeleteStoreDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            deletedAt: Date;
        };
    }>;
}
