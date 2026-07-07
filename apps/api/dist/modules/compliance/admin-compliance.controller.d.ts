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
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            slab: import("@prisma/client").$Enums.GstSlab;
            cgstRate: import("@prisma/client/runtime/library").Decimal;
            sgstRate: import("@prisma/client/runtime/library").Decimal;
            igstRate: import("@prisma/client/runtime/library").Decimal;
            totalRate: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
    jurisdictions(): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            isActive: boolean;
            stateCode: string;
            stateName: string;
        }[];
    }>;
    hsn(q?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            description: string;
            code: string;
            isActive: boolean;
            defaultGstSlab: import("@prisma/client").$Enums.GstSlab;
        }[];
    }>;
    listInvoices(query: ListComplianceQueryDto): Promise<{
        success: boolean;
        data: {
            items: {
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
            }[];
            total: number;
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
            items: ({
                invoice: {
                    invoiceNumber: string;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.CreditNoteStatus;
                createdAt: Date;
                reason: string;
                orderId: string;
                invoiceId: string;
                taxableAmount: import("@prisma/client/runtime/library").Decimal;
                cgstAmount: import("@prisma/client/runtime/library").Decimal;
                sgstAmount: import("@prisma/client/runtime/library").Decimal;
                igstAmount: import("@prisma/client/runtime/library").Decimal;
                totalTax: import("@prisma/client/runtime/library").Decimal;
                grandTotal: import("@prisma/client/runtime/library").Decimal;
                pdfStorageKey: string | null;
                emailedAt: Date | null;
                creditNoteNumber: string;
                isPartial: boolean;
                issuedAt: Date;
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    creditNotePdf(id: string, res: Response): Promise<void>;
    listDebitNotes(query: ListComplianceQueryDto): Promise<{
        success: boolean;
        data: {
            items: ({
                merchantProfile: {
                    businessName: string;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.DebitNoteStatus;
                createdAt: Date;
                reason: string;
                orderId: string | null;
                merchantProfileId: string;
                invoiceId: string | null;
                taxableAmount: import("@prisma/client/runtime/library").Decimal;
                totalTax: import("@prisma/client/runtime/library").Decimal;
                grandTotal: import("@prisma/client/runtime/library").Decimal;
                issuedAt: Date;
                debitNoteNumber: string;
            })[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    tds(month?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            merchant: string;
            periodMonth: string;
            taxableAmount: number;
            tdsRate: number;
            tdsAmount: number;
        }[];
    }>;
    tcs(month?: string): Promise<{
        success: boolean;
        data: {
            records: {
                periodMonth: string;
                gmvAmount: number;
                tcsRate: number;
                tcsAmount: number;
            }[];
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
