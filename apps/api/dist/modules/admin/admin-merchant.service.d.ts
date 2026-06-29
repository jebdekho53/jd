import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { RemoveBlacklistDto } from './dto/remove-blacklist.dto';
export declare class AdminMerchantService {
    private readonly prisma;
    private readonly audit;
    private readonly domainEvents;
    private readonly blocklist;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditService, domainEvents: DomainEventsService, blocklist: VerificationBlocklistService);
    removeBlacklist(superAdminUserId: string, merchantProfileId: string, dto: RemoveBlacklistDto, ipAddress?: string, userAgent?: string): Promise<{
        merchantProfileId: string;
        isBlacklisted: boolean;
        reopenedStoreId?: string;
    }>;
}
