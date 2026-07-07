import { SupportActorType, SupportMessageVisibility, SupportPriority } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SupportSlaService } from './support-sla.service';
import { TicketAssignmentService } from './ticket-assignment.service';
import { SupportAutomationService } from './support-automation.service';
import { MembershipBenefitService } from '../membership/membership-benefit.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface CreateTicketInput {
    requesterUserId: string;
    actorType: SupportActorType;
    categoryCode: string;
    subject: string;
    description: string;
    channel?: 'IN_APP' | 'EMAIL' | 'CHAT' | 'PHONE' | 'WHATSAPP';
    priority?: SupportPriority;
    orderId?: string;
    paymentId?: string;
    walletTransactionId?: string;
    gstInvoiceId?: string;
}
export declare class SupportTicketService {
    private readonly prisma;
    private readonly audit;
    private readonly sla;
    private readonly assignment;
    private readonly automation;
    private readonly membershipBenefits;
    private readonly emailNotifications;
    private readonly events;
    constructor(prisma: PrismaService, audit: AuditService, sla: SupportSlaService, assignment: TicketAssignmentService, automation: SupportAutomationService, membershipBenefits: MembershipBenefitService, emailNotifications: EmailNotificationService, events: EventEmitter2);
    createTicket(input: CreateTicketInput, ipAddress?: string): Promise<{
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
    }>;
    listTicketsForUser(userId: string, page?: number, limit?: number): Promise<{
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
            feedback: {
                id: string;
                createdAt: Date;
                rating: number;
                ticketId: string;
                comment: string | null;
            } | null;
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
    getTicketForUser(ticketId: string, userId: string, isStaff?: boolean): Promise<{
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
        resolution: {
            id: string;
            createdAt: Date;
            resolvedBy: string;
            ticketId: string;
            summary: string;
            refundApproved: boolean | null;
        } | null;
        assignments: ({
            agent: {
                user: {
                    phone: string;
                };
            } & {
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
        attachments: {
            id: string;
            createdAt: Date;
            messageId: string | null;
            ticketId: string;
            fileName: string;
            mimeType: string;
            storageKey: string;
            sizeBytes: number | null;
        }[];
        messages: {
            id: string;
            createdAt: Date;
            body: string;
            ticketId: string;
            authorId: string;
            visibility: import("@prisma/client").$Enums.SupportMessageVisibility;
        }[];
        feedback: {
            id: string;
            createdAt: Date;
            rating: number;
            ticketId: string;
            comment: string | null;
        } | null;
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
    }>;
    reply(ticketId: string, authorId: string, body: string, visibility?: SupportMessageVisibility, isStaff?: boolean): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        ticketId: string;
        authorId: string;
        visibility: import("@prisma/client").$Enums.SupportMessageVisibility;
    }>;
    addAttachment(ticketId: string, userId: string, file: {
        fileName: string;
        mimeType: string;
        storageKey: string;
        sizeBytes?: number;
    }, messageId?: string): Promise<{
        id: string;
        createdAt: Date;
        messageId: string | null;
        ticketId: string;
        fileName: string;
        mimeType: string;
        storageKey: string;
        sizeBytes: number | null;
    }>;
    submitFeedback(ticketId: string, userId: string, rating: number, comment?: string): Promise<{
        id: string;
        createdAt: Date;
        rating: number;
        ticketId: string;
        comment: string | null;
    }>;
    resolveTicket(ticketId: string, agentUserId: string, summary: string, refundApproved?: boolean): Promise<{
        ticketId: string;
        status: "RESOLVED";
    }>;
    private inferPriority;
    private nextTicketNumber;
}
