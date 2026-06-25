import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GstPdfService } from './gst-pdf.service';
import { GstSupplyType } from '@prisma/client';
import { EmailNotificationService } from '../email/email-notification.service';

@Injectable()
export class GstEmailService {
  private readonly logger = new Logger(GstEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: GstPdfService,
    private readonly emails: EmailNotificationService,
  ) {}

  async sendInvoiceEmail(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.gSTInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        lines: true,
        order: {
          include: {
            buyerProfile: { include: { user: { select: { email: true, phone: true } } } },
          },
        },
      },
    });
    if (!invoice) return;

    const email = invoice.order.buyerProfile.user.email;
    if (!email) {
      this.logger.warn({ invoiceId }, 'Invoice email skipped — buyer has no email');
      return;
    }

    try {
      const pdfBuffer = await this.pdf.generateInvoicePdf({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        supplierGstin: invoice.supplierGstin,
        buyerGstin: invoice.buyerGstin,
        supplierState: invoice.supplierState,
        placeOfSupply: invoice.placeOfSupply,
        supplyType: invoice.supplyType === GstSupplyType.INTRA_STATE ? 'Intra-State' : 'Inter-State',
        lines: invoice.lines.map((l) => ({
          productName: l.productName,
          hsnCode: l.hsnCode,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice),
          taxableAmount: Number(l.taxableAmount),
          cgstAmount: Number(l.cgstAmount),
          sgstAmount: Number(l.sgstAmount),
          igstAmount: Number(l.igstAmount),
          lineTotal: Number(l.lineTotal),
        })),
        totals: {
          subtotal: Number(invoice.subtotal),
          taxableAmount: Number(invoice.taxableAmount),
          cgstAmount: Number(invoice.cgstAmount),
          sgstAmount: Number(invoice.sgstAmount),
          igstAmount: Number(invoice.igstAmount),
          totalTax: Number(invoice.totalTax),
          deliveryFee: Number(invoice.deliveryFee),
          grandTotal: Number(invoice.grandTotal),
        },
      });

      await this.emails.sendGstInvoiceEmail(invoiceId, pdfBuffer, invoice.invoiceNumber, email);

      await this.prisma.gSTInvoice.update({
        where: { id: invoiceId },
        data: { emailedAt: new Date() },
      });
    } catch (err) {
      this.logger.error({ err, invoiceId }, 'Invoice email failed');
    }
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
    if (!email) return;

    try {
      await this.emails.sendRefundProcessed(note.orderId);
      await this.prisma.creditNote.update({
        where: { id: creditNoteId },
        data: { emailedAt: new Date() },
      });
    } catch (err) {
      this.logger.error({ err, creditNoteId }, 'Credit note email failed');
    }
  }
}
