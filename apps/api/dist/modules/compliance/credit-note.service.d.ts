import { PrismaService } from '../../database/prisma.service';
import { GstPdfService } from './gst-pdf.service';
import { GstEmailService } from './gst-email.service';
export interface RefundLineInput {
    orderItemId: string;
    quantity: number;
}
export declare class CreditNoteService {
    private readonly prisma;
    private readonly pdf;
    private readonly email;
    private readonly logger;
    constructor(prisma: PrismaService, pdf: GstPdfService, email: GstEmailService);
    createForRefund(orderId: string, reason: string, partialLines?: RefundLineInput[]): Promise<{
        creditNoteId: string;
        creditNoteNumber: string;
    }>;
    getCreditNotePdf(creditNoteId: string): Promise<Buffer>;
    private nextCreditNoteNumber;
}
