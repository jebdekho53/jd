import { SupportPriority } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class SupportSlaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSla(priority: SupportPriority): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: import("@prisma/client").$Enums.SupportPriority;
        responseMinutes: number;
        resolutionMinutes: number;
        escalationMinutes: number;
    } | null>;
    computeDeadlines(priority: SupportPriority, from?: Date): Promise<{
        slaResponseDue: Date;
        slaResolutionDue: Date;
    }>;
    isResponseOverdue(ticket: {
        firstResponseAt: Date | null;
        slaResponseDue: Date | null;
        status: string;
    }): boolean;
    isResolutionOverdue(ticket: {
        resolvedAt: Date | null;
        slaResolutionDue: Date | null;
        status: string;
    }): boolean;
}
