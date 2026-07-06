import { Response } from 'express';
import { ComplianceService } from './compliance.service';
import { GstConfigService } from './gst-config.service';
import { ComplianceExportService } from './compliance-export.service';
import { TdsTcsService } from './tds-tcs.service';
import { InvoiceEngineService } from './invoice-engine.service';
import { CreditNoteService } from './credit-note.service';
import { PrismaService } from '../../database/prisma.service';
import { ExportComplianceQueryDto, ListComplianceQueryDto, SyncTdsTcsDto } from './dto/compliance.dto';
export declare class AdminComplianceController {
    private readonly prisma;
    private readonly compliance;
    private readonly config;
    private readonly exports;
    private readonly tdsTcs;
    private readonly invoices;
    private readonly creditNotes;
    constructor(prisma: PrismaService, compliance: ComplianceService, config: GstConfigService, exports: ComplianceExportService, tdsTcs: TdsTcsService, invoices: InvoiceEngineService, creditNotes: CreditNoteService);
    overview(): Promise<{
        success: boolean;
        data: {};
    }>;
    taxRates(): Promise<{
        success: boolean;
        data: any;
    }>;
    jurisdictions(): Promise<{
        success: boolean;
        data: any;
    }>;
    hsn(q?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    listInvoices(query: ListComplianceQueryDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    invoiceDetail(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            invoiceNumber: string;
            orderId: string;
            orderNumber: string | undefined;
            storeName: string | undefined;
            status: string;
            supplyType: string;
            supplierGstin: string | null;
            taxableAmount: number;
            cgstAmount: number;
            sgstAmount: number;
            igstAmount: number;
            totalTax: number;
            grandTotal: number;
            deliveryFee: number;
            invoiceDate: Date;
            emailedAt: Date | null;
            isImmutable: boolean;
        } | null;
    }>;
    invoicePdf(id: string, res: Response): Promise<void>;
    listCreditNotes(query: ListComplianceQueryDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    creditNotePdf(id: string, res: Response): Promise<void>;
    listDebitNotes(query: ListComplianceQueryDto): Promise<{
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    tds(month?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    tcs(month?: string): Promise<{
        success: boolean;
        data: {
            records: any;
            totalTcs: number;
        };
    }>;
    syncTdsTcs(dto: SyncTdsTcsDto): Promise<{
        success: boolean;
        data: {
            merchants: number;
            platformGmv: number;
        };
    }>;
    monthlyGst(query: ExportComplianceQueryDto, res: Response): Promise<void>;
    invoiceRegister(query: ExportComplianceQueryDto, res: Response): Promise<void>;
    creditRegister(query: ExportComplianceQueryDto, res: Response): Promise<void>;
    taxLiability(query: ExportComplianceQueryDto, res: Response): Promise<void>;
    private sendExport;
}
