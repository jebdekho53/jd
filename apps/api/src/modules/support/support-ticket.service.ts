import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SupportActorType,
  SupportMessageVisibility,
  SupportPriority,
  SupportTicketStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SupportSlaService } from './support-sla.service';
import { TicketAssignmentService } from './ticket-assignment.service';
import { SupportAutomationService } from './support-automation.service';
import { MembershipBenefitService } from '../membership/membership-benefit.service';

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

@Injectable()
export class SupportTicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly sla: SupportSlaService,
    private readonly assignment: TicketAssignmentService,
    private readonly automation: SupportAutomationService,
    private readonly membershipBenefits: MembershipBenefitService,
  ) {}

  async createTicket(input: CreateTicketInput, ipAddress?: string) {
    const category = await this.prisma.supportCategory.findUnique({
      where: { code: input.categoryCode },
    });
    if (!category || !category.isActive) {
      throw new BadRequestException('Invalid support category');
    }

    let priority = input.priority ?? this.inferPriority(input.categoryCode);
    if (await this.membershipBenefits.isVipSupport(input.requesterUserId)) {
      priority = SupportPriority.HIGH;
    }
    const team = this.assignment.resolveTeam(category.code, input.actorType);
    const deadlines = await this.sla.computeDeadlines(priority);
    const ticketNumber = await this.nextTicketNumber();
    const isRefundDispute = ['REFUND_ISSUE', 'ORDER_DISPUTE'].includes(category.code);

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        requesterUserId: input.requesterUserId,
        actorType: input.actorType,
        channel: input.channel ?? 'IN_APP',
        categoryId: category.id,
        priority,
        subject: input.subject,
        description: input.description,
        orderId: input.orderId,
        paymentId: input.paymentId,
        walletTransactionId: input.walletTransactionId,
        gstInvoiceId: input.gstInvoiceId,
        isRefundDispute,
        assignedTeam: team,
        ...deadlines,
        messages: {
          create: {
            authorId: input.requesterUserId,
            body: input.description,
            visibility: SupportMessageVisibility.PUBLIC,
          },
        },
      },
      include: { category: true },
    });

    await this.assignment.assignTicket(ticket.id, team);
    await this.automation.autoTagTicket(ticket.id, category.code, input.orderId);

    void this.audit.log({
      actorId: input.requesterUserId,
      action: 'SUPPORT_TICKET_CREATED',
      resourceType: 'support_ticket',
      resourceId: ticket.id,
      ipAddress,
      metadata: { ticketNumber, category: category.code } as Prisma.InputJsonValue,
    });

    return ticket;
  }

  async listTicketsForUser(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { requesterUserId: userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true, feedback: true },
      }),
      this.prisma.supportTicket.count({ where: { requesterUserId: userId } }),
    ]);
    return { items, total, page, limit };
  }

  async getTicketForUser(ticketId: string, userId: string, isStaff = false) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        messages: {
          where: isStaff ? undefined : { visibility: SupportMessageVisibility.PUBLIC },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
        assignments: { where: { isActive: true }, include: { agent: { include: { user: { select: { phone: true } } } } } },
        resolution: true,
        feedback: true,
        tags: { include: { tag: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isStaff && ticket.requesterUserId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return ticket;
  }

  async reply(
    ticketId: string,
    authorId: string,
    body: string,
    visibility: SupportMessageVisibility = SupportMessageVisibility.PUBLIC,
    isStaff = false,
  ) {
    const ticket = await this.getTicketForUser(ticketId, authorId, isStaff);
    if (['CLOSED'].includes(ticket.status)) {
      throw new BadRequestException('Ticket is closed');
    }

    const message = await this.prisma.supportMessage.create({
      data: { ticketId, authorId, body, visibility },
    });

    const updates: Prisma.SupportTicketUpdateInput = {
      status: isStaff ? SupportTicketStatus.WAITING_CUSTOMER : SupportTicketStatus.IN_PROGRESS,
    };
    if (isStaff && !ticket.firstResponseAt) {
      updates.firstResponseAt = new Date();
    }
    await this.prisma.supportTicket.update({ where: { id: ticketId }, data: updates });

    void this.audit.log({
      actorId: authorId,
      action: visibility === SupportMessageVisibility.INTERNAL ? 'SUPPORT_INTERNAL_NOTE' : 'SUPPORT_TICKET_REPLY',
      resourceType: 'support_ticket',
      resourceId: ticketId,
    });

    return message;
  }

  async addAttachment(
    ticketId: string,
    userId: string,
    file: { fileName: string; mimeType: string; storageKey: string; sizeBytes?: number },
    messageId?: string,
  ) {
    await this.getTicketForUser(ticketId, userId);
    return this.prisma.supportAttachment.create({
      data: { ticketId, messageId, ...file },
    });
  }

  async submitFeedback(ticketId: string, userId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be 1-5');
    const ticket = await this.getTicketForUser(ticketId, userId);
    if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      throw new BadRequestException('Ticket must be resolved before feedback');
    }
    return this.prisma.supportFeedback.upsert({
      where: { ticketId },
      create: { ticketId, rating, comment },
      update: { rating, comment },
    });
  }

  async resolveTicket(
    ticketId: string,
    agentUserId: string,
    summary: string,
    refundApproved?: boolean,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    await this.prisma.$transaction([
      this.prisma.supportResolution.upsert({
        where: { ticketId },
        create: { ticketId, resolvedBy: agentUserId, summary, refundApproved },
        update: { summary, refundApproved, resolvedBy: agentUserId },
      }),
      this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: SupportTicketStatus.RESOLVED, resolvedAt: new Date() },
      }),
    ]);

    void this.audit.log({
      actorId: agentUserId,
      action: 'SUPPORT_TICKET_RESOLVED',
      resourceType: 'support_ticket',
      resourceId: ticketId,
      metadata: { refundApproved } as Prisma.InputJsonValue,
    });

    return { ticketId, status: SupportTicketStatus.RESOLVED };
  }

  private inferPriority(categoryCode: string): SupportPriority {
    if (['REFUND_ISSUE', 'PAYMENT_PROBLEM', 'COD_MISMATCH'].includes(categoryCode)) {
      return SupportPriority.HIGH;
    }
    if (['DELIVERY_PROBLEM', 'ORDER_ISSUE'].includes(categoryCode)) {
      return SupportPriority.MEDIUM;
    }
    return SupportPriority.LOW;
  }

  private async nextTicketNumber(): Promise<string> {
    const now = new Date();
    const periodKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const seq = await this.prisma.$transaction(async (tx) => {
      const row = await tx.supportTicketSequence.upsert({
        where: { periodKey },
        create: { periodKey, lastSequence: 1 },
        update: { lastSequence: { increment: 1 } },
      });
      return row.lastSequence;
    });
    return `JD-TKT-${periodKey}-${String(seq).padStart(6, '0')}`;
  }
}
