import { Store, StoreDocumentType, StoreHour } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { MerchantService } from '../merchant/merchant.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { LocationDirectoryService } from '../location-directory/location-directory.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ListStoresDto } from './dto/list-stores.dto';
import { UploadVerificationDocumentDto } from './dto/upload-verification-document.dto';
import { ConfigService } from '@nestjs/config';
type StoreWithRelations = Store & {
    hours: StoreHour[];
    storeZones: Array<{
        zone: {
            id: string;
            name: string;
            slug: string;
        };
    }>;
    storeServiceAreas: Array<{
        serviceArea: {
            id: string;
            name: string;
            slug: string;
        };
    }>;
    verificationDocuments: Array<{
        id: string;
        documentType: StoreDocumentType;
        fileName: string;
        fileUrl: string;
        mimeType: string;
        uploadedAt: Date;
    }>;
    documentRequests: Array<{
        id: string;
        reason: string;
        documentTypes: unknown;
        requestedAt: Date;
        fulfilledAt: Date | null;
    }>;
    merchantProfile?: {
        id: string;
        isBlacklisted: boolean;
        blacklistReason: string | null;
        businessName: string;
    };
};
export declare class StoreService {
    private readonly prisma;
    private readonly merchantService;
    private readonly audit;
    private readonly domainEvents;
    private readonly buyerCache;
    private readonly blocklist;
    private readonly locations;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, merchantService: MerchantService, audit: AuditService, domainEvents: DomainEventsService, buyerCache: BuyerCacheService, blocklist: VerificationBlocklistService, locations: LocationDirectoryService, config: ConfigService);
    createStore(userId: string, dto: CreateStoreDto, ipAddress?: string): Promise<StoreWithRelations>;
    listStores(userId: string, dto: ListStoresDto): Promise<{
        stores: StoreWithRelations[];
        total: number;
    }>;
    getStore(userId: string, storeId: string): Promise<StoreWithRelations>;
    updateStore(userId: string, storeId: string, dto: UpdateStoreDto, ipAddress?: string): Promise<StoreWithRelations>;
    submitForReview(userId: string, storeId: string, ipAddress?: string): Promise<StoreWithRelations>;
    uploadVerificationDocument(userId: string, storeId: string, dto: UploadVerificationDocumentDto, ipAddress?: string): Promise<StoreWithRelations>;
    submitDocumentsForReview(userId: string, storeId: string, ipAddress?: string): Promise<StoreWithRelations>;
    fetchStoreWithRelations(storeId: string): Promise<StoreWithRelations>;
    private parseDocumentTypes;
    private assertMerchantNotBlocked;
    private assertOwnership;
    private validateSubmissionReadiness;
    private generateUniqueSlug;
}
export {};
