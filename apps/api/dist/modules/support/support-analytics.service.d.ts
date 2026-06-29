import { SupportTicketStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class SupportAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(): Promise<{
        ticketsCreated: number;
        ticketsResolved: number;
        ticketsOpen: number;
        averageResolutionHours: number;
        slaCompliancePct: number;
        csatScore: number | null;
        agentAssignments: number;
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
        items: ({
            category: {
                id: string;
                name: string;
                createdAt: Date;
                description: string | null;
                audience: import("@prisma/client").$Enums.SupportActorType;
                code: string;
                isActive: boolean;
                sortOrder: number;
            };
            assignments: ({
                agent: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    isActive: boolean;
                    team: import("@prisma/client").$Enums.SupportTeam;
                };
            } & {
                id: string;
                assignedAt: Date;
                assignedBy: string | null;
                isActive: boolean;
                ticketId: string;
                note: string | null;
                unassignedAt: Date | null;
                agentId: string;
            })[];
            requester: {
                phone: string;
                email: string | null;
                id: string;
            };
            tags: ({
                tag: {
                    id: string;
                    name: string;
                    createdAt: Date;
                };
            } & {
                ticketId: string;
                tagId: string;
            })[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.SupportTicketStatus;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            resolvedAt: Date | null;
            categoryId: string;
            orderId: string | null;
            subject: string;
            priority: import("@prisma/client").$Enums.SupportPriority;
            ticketNumber: string;
            requesterUserId: string;
            actorType: import("@prisma/client").$Enums.SupportActorType;
            channel: import("@prisma/client").$Enums.SupportChannel;
            paymentId: string | null;
            walletTransactionId: string | null;
            gstInvoiceId: string | null;
            isRefundDispute: boolean;
            assignedTeam: import("@prisma/client").$Enums.SupportTeam | null;
            firstResponseAt: Date | null;
            slaResponseDue: Date | null;
            slaResolutionDue: Date | null;
            closedAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
}
