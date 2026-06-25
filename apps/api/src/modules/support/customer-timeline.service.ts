import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomerTimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimeline(userId: string) {
    const buyer = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!buyer) return { events: [] };

    const [orders, walletTx, tickets, fraudCases, refunds] = await Promise.all([
      this.prisma.order.findMany({
        where: { buyerProfileId: buyer.id },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
      }),
      this.prisma.walletTransaction.findMany({
        where: { wallet: { buyerProfileId: buyer.id } },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { id: true, type: true, amount: true, description: true, createdAt: true },
      }),
      this.prisma.supportTicket.findMany({
        where: { requesterUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { id: true, ticketNumber: true, subject: true, status: true, createdAt: true },
      }),
      this.prisma.fraudCase.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, caseNumber: true, title: true, status: true, createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { buyerProfileId: buyer.id, status: 'REFUNDED' },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { id: true, orderNumber: true, totalAmount: true, updatedAt: true },
      }),
    ]);

    const events = [
      ...orders.map((o) => ({
        type: 'order' as const,
        id: o.id,
        label: `Order #${o.orderNumber}`,
        detail: o.status,
        amount: Number(o.totalAmount),
        at: o.createdAt,
      })),
      ...walletTx.map((t) => ({
        type: 'wallet' as const,
        id: t.id,
        label: t.type,
        detail: t.description ?? '',
        amount: Number(t.amount),
        at: t.createdAt,
      })),
      ...tickets.map((t) => ({
        type: 'support' as const,
        id: t.id,
        label: t.ticketNumber,
        detail: t.subject,
        status: t.status,
        at: t.createdAt,
      })),
      ...fraudCases.map((f) => ({
        type: 'fraud' as const,
        id: f.id,
        label: f.caseNumber,
        detail: f.title,
        status: f.status,
        at: f.createdAt,
      })),
      ...refunds.map((r) => ({
        type: 'refund' as const,
        id: r.id,
        label: `Refund #${r.orderNumber}`,
        detail: 'REFUNDED',
        amount: Number(r.totalAmount),
        at: r.updatedAt,
      })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());

    return { events: events.slice(0, 40) };
  }

  async getTimelineForTicket(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { requesterUserId: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.getTimeline(ticket.requesterUserId);
  }
}
