import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { MerchantService } from '../merchant/merchant.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { RequestCategoryAccessDto, UploadCategoryDocumentDto } from './dto/category-governance.dto';
import { MerchantCategoryAccessService } from './merchant-category-access.service';
export declare class MerchantCategoryRequestService {
    private readonly prisma;
    private readonly merchantService;
    private readonly blocklist;
    private readonly audit;
    private readonly domainEvents;
    private readonly categoryAccess;
    private readonly logger;
    constructor(prisma: PrismaService, merchantService: MerchantService, blocklist: VerificationBlocklistService, audit: AuditService, domainEvents: DomainEventsService, categoryAccess: MerchantCategoryAccessService);
    listCatalog(userId: string): Promise<any>;
    listMyRequests(userId: string): Promise<any>;
    requestCategoryAccess(userId: string, dto: RequestCategoryAccessDto, ipAddress?: string): Promise<any>;
    uploadDocument(userId: string, requestId: string, dto: UploadCategoryDocumentDto, ipAddress?: string): Promise<any>;
    submitDocuments(userId: string, requestId: string, ipAddress?: string): Promise<any>;
    listApprovedCategories(userId: string): Promise<import("./merchant-category-access.service").ApprovedCategoryTree[]>;
    private getRequestForMerchant;
    private assertRequestOwnership;
    private parseDocumentTypes;
}
