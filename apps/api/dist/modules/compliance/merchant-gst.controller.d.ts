import { Response } from 'express';
import { RequestUser } from '../../common/types';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from './compliance.service';
import { GstConfigService } from './gst-config.service';
import { ComplianceExportService } from './compliance-export.service';
import { InvoiceEngineService } from './invoice-engine.service';
import { EnsureHsnCodeDto, ExportComplianceQueryDto, ListComplianceQueryDto, UpdateProductTaxDto } from './dto/compliance.dto';
export declare class MerchantGstController {
    private readonly prisma;
    private readonly compliance;
    private readonly config;
    private readonly exports;
    private readonly invoices;
    constructor(prisma: PrismaService, compliance: ComplianceService, config: GstConfigService, exports: ComplianceExportService, invoices: InvoiceEngineService);
    private merchantProfileId;
    overview(user: RequestUser, month?: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            summary: {
                invoiceCount: any;
                taxableSales: number;
                gstCollected: number;
                grossTotal: number;
            };
            recentInvoices: any;
            tds: {
                records: any;
                totalTds: number;
            };
        };
        message?: undefined;
    }>;
    listInvoices(user: RequestUser, query: ListComplianceQueryDto): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            items: any;
            total: any;
            page: number;
            limit: number;
        };
        message?: undefined;
    }>;
    invoicePdf(user: RequestUser, id: string, res: Response): Promise<void>;
    exportSummary(user: RequestUser, query: ExportComplianceQueryDto, res: Response): Promise<void>;
    hsn(q?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    ensureHsn(dto: EnsureHsnCodeDto): Promise<{
        success: boolean;
        data: any;
    }>;
    updateProductTax(user: RequestUser, productId: string, dto: UpdateProductTaxDto): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: any;
        message?: undefined;
    }>;
}
