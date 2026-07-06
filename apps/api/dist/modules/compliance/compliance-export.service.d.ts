import { PrismaService } from '../../database/prisma.service';
import { GstPdfService } from './gst-pdf.service';
export type ComplianceExportFormat = 'csv' | 'pdf';
export declare class ComplianceExportService {
    private readonly prisma;
    private readonly pdf;
    constructor(prisma: PrismaService, pdf: GstPdfService);
    invoiceRegister(month?: string, format?: ComplianceExportFormat): Promise<{
        content: string;
        mime: string;
        filename: string;
        binary?: undefined;
    } | {
        content: any;
        mime: string;
        filename: string;
        binary: boolean;
    }>;
    creditNoteRegister(month?: string, format?: ComplianceExportFormat): Promise<{
        content: string;
        mime: string;
        filename: string;
        binary?: undefined;
    } | {
        content: any;
        mime: string;
        filename: string;
        binary: boolean;
    }>;
    monthlyGstSummary(month: string, format?: ComplianceExportFormat): Promise<{
        content: string;
        mime: string;
        filename: string;
        binary?: undefined;
    } | {
        content: any;
        mime: string;
        filename: string;
        binary: boolean;
    }>;
    merchantGstSummary(merchantProfileId: string, month?: string, format?: ComplianceExportFormat): Promise<{
        content: string;
        mime: string;
        filename: string;
        binary?: undefined;
    } | {
        content: any;
        mime: string;
        filename: string;
        binary: boolean;
    }>;
    taxLiabilityReport(month: string, format?: ComplianceExportFormat): Promise<{
        content: string;
        mime: string;
        filename: string;
        binary?: undefined;
    } | {
        content: any;
        mime: string;
        filename: string;
        binary: boolean;
    }>;
    private monthFilter;
    private export;
}
