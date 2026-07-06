import { SupportTicketStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class SupportAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(): Promise<{
        ticketsCreated: any;
        ticketsResolved: any;
        ticketsOpen: any;
        averageResolutionHours: number;
        slaCompliancePct: number;
        csatScore: number | null;
        agentAssignments: any;
    }>;
    listAdminTickets(filter: {
        status?: SupportTicketStatus;
        priority?: string;
        team?: string;
        actorType?: string;
        refundOnly?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
}
