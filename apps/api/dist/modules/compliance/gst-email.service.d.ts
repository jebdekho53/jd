import { PrismaService } from '../../database/prisma.service';
import { GstPdfService } from './gst-pdf.service';
import { EmailNotificationService } from '../email/email-notification.service';
export declare class GstEmailService {
    private readonly prisma;
    private readonly pdf;
    private readonly emails;
    private readonly logger;
    constructor(prisma: PrismaService, pdf: GstPdfService, emails: EmailNotificationService);
    sendInvoiceEmail(invoiceId: string): Promise<void>;
    sendCreditNoteEmail(creditNoteId: string): Promise<void>;
}
