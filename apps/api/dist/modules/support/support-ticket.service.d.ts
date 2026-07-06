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
    createTicket(input: CreateTicketInput, ipAddress?: string): Promise<any>;
    listTicketsForUser(userId: string, page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getTicketForUser(ticketId: string, userId: string, isStaff?: boolean): Promise<any>;
    reply(ticketId: string, authorId: string, body: string, visibility?: SupportMessageVisibility, isStaff?: boolean): Promise<any>;
    addAttachment(ticketId: string, userId: string, file: {
        fileName: string;
        mimeType: string;
        storageKey: string;
        sizeBytes?: number;
    }, messageId?: string): Promise<any>;
    submitFeedback(ticketId: string, userId: string, rating: number, comment?: string): Promise<any>;
    resolveTicket(ticketId: string, agentUserId: string, summary: string, refundApproved?: boolean): Promise<{
        ticketId: string;
        status: any;
    }>;
    private inferPriority;
    private nextTicketNumber;
}
