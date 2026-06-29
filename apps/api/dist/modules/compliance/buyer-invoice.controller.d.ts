import { Response } from 'express';
import { RequestUser } from '../../common/types';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceService } from './compliance.service';
import { InvoiceEngineService } from './invoice-engine.service';
import { GstEmailService } from './gst-email.service';
export declare class BuyerInvoiceController {
    private readonly prisma;
    private readonly compliance;
    private readonly invoices;
    private readonly email;
    constructor(prisma: PrismaService, compliance: ComplianceService, invoices: InvoiceEngineService, email: GstEmailService);
    private buyerProfileId;
    getInvoice(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: null;
        message?: undefined;
    } | {
        success: boolean;
        data: {
            orderNumber: string;
            orderStatus: import("@prisma/client").$Enums.OrderStatus;
            lines: {
                id: string;
                productName: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                invoiceId: string;
                orderItemId: string | null;
                gstSlab: import("@prisma/client").$Enums.GstSlab;
                hsnCode: string;
                taxableAmount: import("@prisma/client/runtime/library").Decimal;
                cgstAmount: import("@prisma/client/runtime/library").Decimal;
                sgstAmount: import("@prisma/client/runtime/library").Decimal;
                igstAmount: import("@prisma/client/runtime/library").Decimal;
                cgstRate: import("@prisma/client/runtime/library").Decimal;
                sgstRate: import("@prisma/client/runtime/library").Decimal;
                igstRate: import("@prisma/client/runtime/library").Decimal;
                lineTotal: import("@prisma/client/runtime/library").Decimal;
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
        };
        message?: undefined;
    }>;
    downloadPdf(user: RequestUser, orderId: string, res: Response): Promise<void>;
    emailInvoice(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
