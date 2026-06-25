import { Injectable } from '@nestjs/common';
import { SupportPriority } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SupportSlaService {
  constructor(private readonly prisma: PrismaService) {}

  async getSla(priority: SupportPriority) {
    return this.prisma.supportSla.findUnique({ where: { priority } });
  }

  async computeDeadlines(priority: SupportPriority, from = new Date()) {
    const sla = await this.getSla(priority);
    if (!sla) {
      return {
        slaResponseDue: new Date(from.getTime() + 4 * 60 * 60 * 1000),
        slaResolutionDue: new Date(from.getTime() + 24 * 60 * 60 * 1000),
      };
    }
    return {
      slaResponseDue: new Date(from.getTime() + sla.responseMinutes * 60 * 1000),
      slaResolutionDue: new Date(from.getTime() + sla.resolutionMinutes * 60 * 1000),
    };
  }

  isResponseOverdue(ticket: { firstResponseAt: Date | null; slaResponseDue: Date | null; status: string }) {
    if (ticket.firstResponseAt || !ticket.slaResponseDue) return false;
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) return false;
    return new Date() > ticket.slaResponseDue;
  }

  isResolutionOverdue(ticket: { resolvedAt: Date | null; slaResolutionDue: Date | null; status: string }) {
    if (ticket.resolvedAt || !ticket.slaResolutionDue) return false;
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) return false;
    return new Date() > ticket.slaResolutionDue;
  }
}
