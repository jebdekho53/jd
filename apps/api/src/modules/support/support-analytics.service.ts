import { Injectable } from '@nestjs/common';
import { Prisma, SupportTicketStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SupportAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [created, resolved, open, feedback, resolvedTickets] = await Promise.all([
      this.prisma.supportTicket.count({ where: { createdAt: { gte: since } } }),
      this.prisma.supportTicket.count({
        where: { status: { in: [SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED] }, createdAt: { gte: since } },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING', 'WAITING_CUSTOMER', 'ESCALATED'] } },
      }),
      this.prisma.supportFeedback.findMany({
        where: { createdAt: { gte: since } },
        select: { rating: true },
      }),
      this.prisma.supportTicket.findMany({
        where: { resolvedAt: { not: null }, createdAt: { gte: since } },
        select: { createdAt: true, resolvedAt: true, firstResponseAt: true, slaResponseDue: true, slaResolutionDue: true },
        take: 500,
      }),
    ]);

    const avgResolutionHours =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((s, t) => {
            if (!t.resolvedAt) return s;
            return s + (t.resolvedAt.getTime() - t.createdAt.getTime()) / 3600000;
          }, 0) / resolvedTickets.length
        : 0;

    const slaMet = resolvedTickets.filter(
      (t) => t.resolvedAt && t.slaResolutionDue && t.resolvedAt <= t.slaResolutionDue,
    ).length;
    const slaPct = resolvedTickets.length ? Math.round((slaMet / resolvedTickets.length) * 100) : 100;

    const csat =
      feedback.length > 0
        ? Math.round((feedback.reduce((s, f) => s + f.rating, 0) / feedback.length) * 20)
        : null;

    const agentPerf = await this.prisma.supportAssignment.groupBy({
      by: ['agentId'],
      where: { assignedAt: { gte: since }, isActive: false },
      _count: true,
    });

    return {
      ticketsCreated: created,
      ticketsResolved: resolved,
      ticketsOpen: open,
      averageResolutionHours: Math.round(avgResolutionHours * 10) / 10,
      slaCompliancePct: slaPct,
      csatScore: csat,
      agentAssignments: agentPerf.length,
    };
  }

  async listAdminTickets(filter: {
    status?: SupportTicketStatus;
    priority?: string;
    team?: string;
    actorType?: string;
    refundOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const where: Prisma.SupportTicketWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority as never;
    if (filter.team) where.assignedTeam = filter.team as never;
    if (filter.actorType) where.actorType = filter.actorType as never;
    if (filter.refundOnly) where.isRefundDispute = true;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          requester: { select: { id: true, phone: true, email: true } },
          assignments: { where: { isActive: true }, include: { agent: true } },
          tags: { include: { tag: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
