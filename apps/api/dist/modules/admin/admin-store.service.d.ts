import { RejectionType, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { ListStoreApprovalsDto } from './dto/list-store-approvals.dto';
import { RejectStoreDto } from './dto/reject-store.dto';
import { RequestDocumentsDto } from './dto/request-documents.dto';
import { SuspendStoreDto } from './dto/suspend-store.dto';
import { RevokeRejectionDto } from './dto/revoke-rejection.dto';
import { StoreService } from '../store/store.service';
import { MerchantService } from '../merchant/merchant.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { VerticalService } from '../store-vertical/vertical.service';
type StoreApprovalItem = {
    id: string;
    name: string;
    slug: string;
    status: StoreStatus;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    rejectionReason: string | null;
    rejectionType: RejectionType | null;
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
};
export declare class AdminStoreService {
    private readonly prisma;
    private readonly storeService;
    private readonly audit;
    private readonly domainEvents;
    private readonly buyerCache;
    private readonly blocklist;
    private readonly emailNotifications;
    private readonly merchantService;
    private readonly verticalService;
    private readonly logger;
    constructor(prisma: PrismaService, storeService: StoreService, audit: AuditService, domainEvents: DomainEventsService, buyerCache: BuyerCacheService, blocklist: VerificationBlocklistService, emailNotifications: EmailNotificationService, merchantService: MerchantService, verticalService: VerticalService);
    listStoreApprovals(dto: ListStoreApprovalsDto): Promise<{
        stores: StoreApprovalItem[];
        total: number;
    }>;
    approveStore(adminUserId: string, storeId: string, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        status: StoreStatus;
        isActive: boolean;
        reviewedAt: Date | null;
    }>;
    requestDocuments(adminUserId: string, storeId: string, dto: RequestDocumentsDto, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        status: StoreStatus;
        documentRequestReason: string | null;
        requestedDocumentTypes: unknown;
    }>;
    rejectStore(adminUserId: string, storeId: string, dto: RejectStoreDto, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        status: StoreStatus;
        rejectionReason: string | null;
        rejectionType: RejectionType | null;
    }>;
    revokeRejection(adminUserId: string, storeId: string, dto: RevokeRejectionDto, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        status: StoreStatus;
    }>;
    suspendStore(adminUserId: string, storeId: string, dto: SuspendStoreDto, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        status: StoreStatus;
        isActive: boolean;
    }>;
    reinstateStore(adminUserId: string, storeId: string, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        status: StoreStatus;
        isActive: boolean;
    }>;
    deleteStore(adminUserId: string, storeId: string, dto: {
        reason: string;
    }, ipAddress?: string, userAgent?: string): Promise<{
        id: string;
        deletedAt: Date;
    }>;
    getStoreDetail(storeId: string): Promise<any>;
    private findStoreOrThrow;
    private findStoreWithMerchantOrThrow;
}
export {};
