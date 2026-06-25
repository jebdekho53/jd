import { Injectable, Logger } from '@nestjs/common';
import { SupportPriority, SupportTicketStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { TicketAssignmentService } from './ticket-assignment.service';
import { SupportSlaService } from './support-sla.service';

@Injectable()
export class SupportAutomationService {
  private readonly logger = new Logger(SupportAutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assignment: TicketAssignmentService,
    private readonly sla: SupportSlaService,
  ) {}

  async autoTagTicket(ticketId: string, categoryCode: string, orderId?: string) {
    const tags: string[] = [];
    if (['REFUND_ISSUE', 'ORDER_DISPUTE'].includes(categoryCode)) tags.push('refund-related');
    if (['SETTLEMENT_ISSUE', 'PAYOUT_DELAY', 'GST_ISSUE', 'PAYMENT_PROBLEM'].includes(categoryCode)) {
      tags.push('finance-related');
    }

    if (orderId) {
      const fraudCase = await this.prisma.fraudCase.findFirst({
        where: { subjectType: 'order', subjectId: orderId, status: { in: ['OPEN', 'INVESTIGATING'] } },
      });
      if (fraudCase) tags.push('fraud-related');
    }

    for (const name of tags) {
      const tag = await this.prisma.supportTag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      await this.prisma.supportTicketTag.upsert({
        where: { ticketId_tagId: { ticketId, tagId: tag.id } },
        create: { ticketId, tagId: tag.id },
        update: {},
      });
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async escalateOverdueTickets() {
    const open = await this.prisma.supportTicket.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING', 'WAITING_CUSTOMER'] } },
      take: 100,
    });

    for (const ticket of open) {
      if (!this.sla.isResolutionOverdue(ticket)) continue;

      const nextPriority = this.bumpPriority(ticket.priority);
      if (nextPriority === ticket.priority) continue;

      await this.prisma.$transaction([
        this.prisma.supportEscalation.create({
          data: {
            ticketId: ticket.id,
            fromPriority: ticket.priority,
            toPriority: nextPriority,
            reason: 'SLA resolution overdue — auto-escalated',
          },
        }),
        this.prisma.supportTicket.update({
          where: { id: ticket.id },
          data: { priority: nextPriority, status: SupportTicketStatus.ESCALATED },
        }),
      ]);

      if (ticket.assignedTeam) {
        await this.assignment.assignTicket(ticket.id, ticket.assignedTeam);
      }

      const escalatedTag = await this.ensureTag('escalated');
      await this.prisma.supportTicketTag.upsert({
        where: { ticketId_tagId: { ticketId: ticket.id, tagId: escalatedTag.id } },
        create: { ticketId: ticket.id, tagId: escalatedTag.id },
        update: {},
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async autoCloseResolvedTickets() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.supportTicket.updateMany({
      where: {
        status: SupportTicketStatus.RESOLVED,
        resolvedAt: { lte: cutoff },
      },
      data: { status: SupportTicketStatus.CLOSED, closedAt: new Date() },
    });
    if (result.count > 0) {
      this.logger.log(`Auto-closed ${result.count} resolved tickets`);
    }
  }

  private bumpPriority(p: SupportPriority): SupportPriority {
    const order: SupportPriority[] = [
      SupportPriority.LOW,
      SupportPriority.MEDIUM,
      SupportPriority.HIGH,
      SupportPriority.CRITICAL,
    ];
    const idx = order.indexOf(p);
    return order[Math.min(idx + 1, order.length - 1)];
  }

  private async ensureTag(name: string) {
    return this.prisma.supportTag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
}
