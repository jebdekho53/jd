import { Prisma } from '@prisma/client';
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
    }>;
    listCreditNotes(page?: number, limit?: number): Promise<{
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
            taxableAmount: Prisma.Decimal;
            cgstAmount: Prisma.Decimal;
            sgstAmount: Prisma.Decimal;
            igstAmount: Prisma.Decimal;
            totalTax: Prisma.Decimal;
            grandTotal: Prisma.Decimal;
            pdfStorageKey: string | null;
            emailedAt: Date | null;
            creditNoteNumber: string;
            isPartial: boolean;
            issuedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    listDebitNotes(page?: number, limit?: number): Promise<{
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
            taxableAmount: Prisma.Decimal;
            totalTax: Prisma.Decimal;
            grandTotal: Prisma.Decimal;
            issuedAt: Date;
            debitNoteNumber: string;
        })[];
        total: number;
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
            invoiceCount: number;
            taxableSales: number;
            gstCollected: number;
            grossTotal: number;
        };
        recentInvoices: {
            id: string;
            invoiceNumber: string;
            orderNumber: string;
            grandTotal: number;
            invoiceDate: Date;
        }[];
        tds: {
            records: {
                periodMonth: string;
                taxableAmount: number;
                tdsRate: number;
                tdsAmount: number;
            }[];
            totalTds: number;
        };
    }>;
    buyerInvoiceForOrder(orderId: string, buyerProfileId: string): Promise<{
        orderNumber: string;
        orderStatus: import("@prisma/client").$Enums.OrderStatus;
        lines: {
            id: string;
            productName: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            invoiceId: string;
            orderItemId: string | null;
            gstSlab: import("@prisma/client").$Enums.GstSlab;
            hsnCode: string;
            taxableAmount: Prisma.Decimal;
            cgstAmount: Prisma.Decimal;
            sgstAmount: Prisma.Decimal;
            igstAmount: Prisma.Decimal;
            cgstRate: Prisma.Decimal;
            sgstRate: Prisma.Decimal;
            igstRate: Prisma.Decimal;
            lineTotal: Prisma.Decimal;
        }[];
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
