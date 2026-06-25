import { Injectable } from '@nestjs/common';
import { SupportActorType, SupportTeam } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const CATEGORY_TEAM: Record<string, SupportTeam> = {
  REFUND_ISSUE: SupportTeam.FINANCE,
  PAYMENT_PROBLEM: SupportTeam.FINANCE,
  SETTLEMENT_ISSUE: SupportTeam.FINANCE,
  PAYOUT_DELAY: SupportTeam.FINANCE,
  GST_ISSUE: SupportTeam.COMPLIANCE,
  COD_MISMATCH: SupportTeam.FINANCE,
  RIDER_EARNINGS: SupportTeam.RIDER_OPS,
  DELIVERY_DISPUTE: SupportTeam.RIDER_OPS,
  DELIVERY_PROBLEM: SupportTeam.RIDER_OPS,
  APP_ISSUE: SupportTeam.RIDER_OPS,
  RIDER_ACCOUNT: SupportTeam.RIDER_OPS,
  RIDER_KYC: SupportTeam.RIDER_OPS,
  INVENTORY_ISSUE: SupportTeam.MERCHANT_OPS,
  STORE_VERIFICATION: SupportTeam.MERCHANT_OPS,
  CAMPAIGN_PROBLEM: SupportTeam.MERCHANT_OPS,
  ORDER_DISPUTE: SupportTeam.MERCHANT_OPS,
};

@Injectable()
export class TicketAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  resolveTeam(categoryCode: string, actorType: SupportActorType): SupportTeam {
    if (CATEGORY_TEAM[categoryCode]) return CATEGORY_TEAM[categoryCode];
    if (actorType === SupportActorType.MERCHANT) return SupportTeam.MERCHANT_OPS;
    if (actorType === SupportActorType.RIDER) return SupportTeam.RIDER_OPS;
    return SupportTeam.CUSTOMER_SUPPORT;
  }

  async assignTicket(ticketId: string, team: SupportTeam, assignedBy?: string) {
    const agent = await this.prisma.supportAgent.findFirst({
      where: { team, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!agent) {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { assignedTeam: team },
      });
      return null;
    }

    await this.prisma.supportAssignment.updateMany({
      where: { ticketId, isActive: true },
      data: { isActive: false, unassignedAt: new Date() },
    });

    const assignment = await this.prisma.supportAssignment.create({
      data: {
        ticketId,
        agentId: agent.id,
        assignedBy,
        note: `Auto-assigned to ${team}`,
      },
    });

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedTeam: team, status: 'IN_PROGRESS' },
    });

    return assignment;
  }
}
