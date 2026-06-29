import { PrismaService } from '../../database/prisma.service';
import { GstCalculatorService } from './gst-calculator.service';
import { GstPdfService } from './gst-pdf.service';
import { GstEmailService } from './gst-email.service';
export declare class InvoiceEngineService {
    private readonly prisma;
    private readonly calculator;
    private readonly pdf;
    private readonly email;
    private readonly logger;
    constructor(prisma: PrismaService, calculator: GstCalculatorService, pdf: GstPdfService, email: GstEmailService);
    generateForOrder(orderId: string): Promise<{
        invoiceId: string;
        invoiceNumber: string;
    }>;
    getInvoicePdf(invoiceId: string): Promise<Buffer>;
    private nextInvoiceNumber;
}
