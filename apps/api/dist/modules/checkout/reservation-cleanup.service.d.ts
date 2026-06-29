import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
export declare class ReservationCleanupService {
    private readonly prisma;
    private readonly audit;
    private readonly domainEvents;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditService, domainEvents: DomainEventsService);
    releaseExpiredReservations(): Promise<void>;
}
