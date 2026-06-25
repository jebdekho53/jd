import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GstEmailService {
  private readonly logger = new Logger(GstEmailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendInvoiceEmail(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.gSTInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: {
          include: {
            buyerProfile: { include: { user: { select: { email: true, phone: true } } } },
          },
        },
      },
    });
    if (!invoice) return;

    const email = invoice.order.buyerProfile.user.email;
    this.logger.log(
      { invoiceNumber: invoice.invoiceNumber, email: email ?? invoice.order.buyerProfile.user.phone },
      'Invoice email queued (stub — wire SMTP in production)',
    );

    await this.prisma.gSTInvoice.update({
      where: { id: invoiceId },
      data: { emailedAt: new Date() },
    });
  }

  async sendCreditNoteEmail(creditNoteId: string): Promise<void> {
    const note = await this.prisma.creditNote.findUnique({
      where: { id: creditNoteId },
      include: {
        order: {
          include: {
            buyerProfile: { include: { user: { select: { email: true, phone: true } } } },
          },
        },
      },
    });
    if (!note) return;

    const email = note.order.buyerProfile.user.email;
    this.logger.log(
      { creditNoteNumber: note.creditNoteNumber, email: email ?? note.order.buyerProfile.user.phone },
      'Credit note email queued (stub — wire SMTP in production)',
    );

    await this.prisma.creditNote.update({
      where: { id: creditNoteId },
      data: { emailedAt: new Date() },
    });
  }
}
