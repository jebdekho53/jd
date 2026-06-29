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
            status: import("@prisma/client").StoreStatus;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            rejectionReason: string | null;
            rejectionType: import("@prisma/client").RejectionType | null;
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
        data: {
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
                kycStatus: import("@prisma/client").$Enums.KycStatus;
                isBlacklisted: boolean;
                blacklistReason: string | null;
            };
            storeZones: ({
                zone: {
                    id: string;
                    name: string;
                    slug: string;
                };
            } & {
                id: string;
                storeId: string;
                zoneId: string;
            })[];
            documentRequests: {
                id: string;
                reason: string;
                requestedAt: Date;
                documentTypes: import("@prisma/client/runtime/library").JsonValue;
                fulfilledAt: Date | null;
            }[];
            verificationDocuments: {
                id: string;
                documentType: import("@prisma/client").$Enums.StoreDocumentType;
                fileName: string;
                mimeType: string;
                fileUrl: string;
                uploadedAt: Date;
            }[];
        } & {
            phone: string | null;
            email: string | null;
            id: string;
            status: import("@prisma/client").$Enums.StoreStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
            minOrderAmount: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            ratingAvg: number;
            ratingCount: number;
            latitude: number;
            longitude: number;
            submittedAt: Date | null;
            rejectionReason: string | null;
            merchantProfileId: string;
            cityId: string;
            slug: string;
            logoUrl: string | null;
            bannerUrl: string | null;
            line1: string;
            line2: string | null;
            pincode: string;
            locality: string | null;
            locationPincodeId: string | null;
            locationAreaId: string | null;
            locationCityId: string | null;
            deliveryRadiusKm: number;
            storeType: import("@prisma/client").$Enums.StoreType;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            rejectionType: import("@prisma/client").$Enums.RejectionType | null;
            rejectionRevokedAt: Date | null;
            rejectionRevokedBy: string | null;
            rejectionRevokeReason: string | null;
            documentRequestReason: string | null;
            documentRequestAt: Date | null;
            documentRequestBy: string | null;
            requestedDocumentTypes: import("@prisma/client/runtime/library").JsonValue | null;
            avgPrepTimeMins: number;
            reputationStats: import("@prisma/client/runtime/library").JsonValue | null;
        };
    }>;
    approveStore(user: RequestUser, storeId: string, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").StoreStatus;
            isActive: boolean;
            reviewedAt: Date | null;
        };
    }>;
    requestDocuments(user: RequestUser, storeId: string, dto: RequestDocumentsDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").StoreStatus;
            documentRequestReason: string | null;
            requestedDocumentTypes: unknown;
        };
    }>;
    rejectStore(user: RequestUser, storeId: string, dto: RejectStoreDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").StoreStatus;
            rejectionReason: string | null;
            rejectionType: import("@prisma/client").RejectionType | null;
        };
    }>;
    revokeRejection(user: RequestUser, storeId: string, dto: RevokeRejectionDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").StoreStatus;
        };
    }>;
    suspendStore(user: RequestUser, storeId: string, dto: SuspendStoreDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").StoreStatus;
            isActive: boolean;
        };
    }>;
    reinstateStore(user: RequestUser, storeId: string, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import("@prisma/client").StoreStatus;
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
