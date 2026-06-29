import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export interface AuditLogEntry {
    actorId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Prisma.InputJsonValue;
}
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(entry: AuditLogEntry): Promise<void>;
    logBatch(entries: AuditLogEntry[]): Promise<void>;
}
