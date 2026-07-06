import { PrismaService } from '../../database/prisma.service';
import { ComplianceCacheService } from './compliance-cache.service';
import { TdsTcsService } from './tds-tcs.service';
export declare class ComplianceService {
    private readonly prisma;
    private readonly cache;
    private readonly tdsTcs;
    constructor(prisma: PrismaService, cache: ComplianceCacheService, tdsTcs: TdsTcsService);
    getOverview(): Promise<{}>;
    listInvoices(page?: number, limit?: number, month?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    listCreditNotes(page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    listDebitNotes(page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getInvoiceDetail(invoiceId: string): Promise<{
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
    } | null>;
    merchantGstDashboard(merchantProfileId: string, month?: string): Promise<{
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
    }>;
    buyerInvoiceForOrder(orderId: string, buyerProfileId: string): Promise<{
        orderNumber: any;
        orderStatus: any;
        lines: any;
        id: string;
        invoiceNumber: string;
        orderId: string;
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
    } | null>;
    private mapInvoice;
}
